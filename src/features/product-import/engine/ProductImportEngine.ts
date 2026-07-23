import type { DriverInput, ImportSession, PipelineContext, ReviewItem, SourceType } from '../types';
import { driverRegistry } from '../registry/DriverRegistry';
import { ScreenshotDriver } from '../drivers/ScreenshotDriver';
import { FlyerDriver, UrlDriver, ExcelDriver, ApiDriver } from '../drivers/OtherDrivers';
import { PipelineEngine } from './PipelineEngine';
import {
  LayoutDetectionStage,
  ProductDetectionStage,
  CardCroppingStage,
  VisionOCRStage,
  ProductParsingStage,
  NormalizationStage,
  AICorrectionStage,
  MatchingStage,
  DuplicateDetectionStage,
  ReviewQueueStage
} from '../stages/PipelineStages';
import { queueWorker } from '../queue/QueueWorker';
import { reviewQueueManager } from '../review/ReviewQueue';
import { CatalogUpdateEngine } from '../publish/CatalogUpdateEngine';
import { pluginManager } from '../plugins/PluginManager';
import { ImportEventBus } from '../events/ImportEventBus';

export class ProductImportEngine {
  private pipelineEngine: PipelineEngine;

  constructor() {
    this.pipelineEngine = new PipelineEngine();
    this.initializeRegistriesAndPipeline();
  }

  private initializeRegistriesAndPipeline() {
    // 1. Register Drivers
    driverRegistry.registerDriver(new ScreenshotDriver());
    driverRegistry.registerDriver(new FlyerDriver());
    driverRegistry.registerDriver(new UrlDriver());
    driverRegistry.registerDriver(new ExcelDriver());
    driverRegistry.registerDriver(new ApiDriver());

    // 2. Register Pipeline Stages
    this.pipelineEngine.registerStage(new LayoutDetectionStage());
    this.pipelineEngine.registerStage(new ProductDetectionStage());
    this.pipelineEngine.registerStage(new CardCroppingStage());
    this.pipelineEngine.registerStage(new VisionOCRStage());
    this.pipelineEngine.registerStage(new ProductParsingStage());
    this.pipelineEngine.registerStage(new NormalizationStage());
    this.pipelineEngine.registerStage(new AICorrectionStage());
    this.pipelineEngine.registerStage(new MatchingStage());
    this.pipelineEngine.registerStage(new DuplicateDetectionStage());
    this.pipelineEngine.registerStage(new ReviewQueueStage());
  }

  async runImportSession(sourceType: SourceType, input: DriverInput): Promise<{ session: ImportSession; reviewItems: ReviewItem[]; logs: string[] }> {
    const driver = driverRegistry.getDriver(sourceType);
    if (!driver) {
      throw new Error(`[ProductImportEngine] No driver registered for source type: ${sourceType}`);
    }

    const isValid = await driver.validate(input);
    if (!isValid) {
      throw new Error(`[ProductImportEngine] Driver validation failed for source input.`);
    }

    const fileNames = input.files ? Array.from(input.files).map(f => f.name) : ['sample_screenshot.png'];
    const session = await queueWorker.createSession(sourceType, fileNames);
    const job = await queueWorker.createJob(session.id);

    ImportEventBus.emit('ImportStarted', { sessionId: session.id, sourceType });

    const initialContext: PipelineContext = {
      sessionId: session.id,
      jobId: job.id,
      sourceType,
      input,
      detectedCards: [],
      reviewQueue: [],
      duplicates: [],
      logs: [`Session ${session.id} started using ${driver.name}`],
      metadata: {},
      errors: []
    };

    // Run dynamic plugins first
    const pluginContext = await pluginManager.runPlugins(initialContext);

    // Run 11 pipeline stages
    const finalContext = await this.pipelineEngine.execute(pluginContext);

    // Store review items
    reviewQueueManager.setQueue(finalContext.reviewQueue);

    await queueWorker.finishSession(
      session.id,
      finalContext.detectedCards.length + finalContext.duplicates.length,
      finalContext.duplicates.length,
      finalContext.reviewQueue.length
    );

    ImportEventBus.emit('ImportCompleted', {
      sessionId: session.id,
      detectedCount: finalContext.detectedCards.length,
      reviewCount: finalContext.reviewQueue.length
    });

    return {
      session,
      reviewItems: finalContext.reviewQueue,
      logs: finalContext.logs
    };
  }

  async publishApprovedReviews(items: ReviewItem[]): Promise<{ createdCount: number; updatedCount: number }> {
    const result = await CatalogUpdateEngine.publishApprovedItems(items);
    ImportEventBus.emit('ReviewApproved', result);
    return result;
  }

  getPipelineEngine(): PipelineEngine {
    return this.pipelineEngine;
  }
}

export const productImportEngine = new ProductImportEngine();
