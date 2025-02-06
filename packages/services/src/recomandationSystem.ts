import logger from "./logger";
import chroma from "./chromadb";
// import {  } from "@huggingface/inference";
// import { pipeline } from "@xenova/transformers";
import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";
import { ChromaClient, Collection } from "chromadb";

export class RecomandationSystem {
  private client: ChromaClient = chroma;
  private video_collection?: Collection;
  private embedder?: FeatureExtractionPipeline;

  constructor() {
    this.init()
      .then(() => logger.info("Recomandation System initialized"))
      .catch(err => {
        logger.error(err);
        process.exit(1);
      });
  }
  async init() {
    try {
      this.video_collection =
        this.video_collection ??
        (await this.client.getOrCreateCollection({
          name: "videos",
        }));
      this.embedder =
        this.embedder ??
        (await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2"));
    } catch (error) {
      logger.error("RecomandationSystem.init", error);
      process.exit(1);
    }
  }

  async clearCollection() {
    try {
      await this.client.deleteCollection({
        name: "videos",
      });
      this.video_collection = await this.client.getOrCreateCollection({
        name: "videos",
      });
    } catch (error: any) {
      logger.error("RecomandationSystem.clearCollection", error);
      throw new Error("Failed to clear collection");
    }
  }

  async generateEmbedding(text: string) {
    if (!this.embedder) {
      throw new Error("Embedder not initialized");
    }
    try {
      const output = await this.embedder(text, {
        pooling: "mean",
        normalize: true,
      });

      return Array.from(output.data);
    } catch (error) {
      logger.error("RecomandationSystem.generateEmbedding", error);
      throw new Error("Failed to generate embedding");
    }
  }

  async addOrUpdateVideo(
    video_id: string,
    title: string,
    description: string,
    tags: string[],
  ) {
    if (!this.video_collection) {
      throw new Error("Collection not initialized");
    }
    const embeding = await this.generateEmbedding(
      `${title} ${description} ${tags.join(" ")}`,
    );
    try {
      await this.video_collection.upsert({
        ids: [video_id],
        embeddings: [embeding],
        metadatas: [
          {
            id: video_id,
            title,
          },
        ],
      });
    } catch (error) {
      logger.error("RecomandationSystem.addOrUpdateVideo", error);
      throw new Error("Failed to add or update video");
    }
  }

  async deleteVideo(video_id: string) {
    if (!this.video_collection) {
      throw new Error("Collection not initialized");
    }
    try {
      await this.video_collection.delete({
        ids: [video_id],
      });
    } catch (error) {
      logger.error("RecomandationSystem.deleteVideo", error);
      throw new Error("Failed to delete video");
    }
  }

  async getRecomandations(text: string, limit: number): Promise<string[]> {
    if (!this.video_collection) {
      throw new Error("Collection not initialized");
    }
    const userEmbedding = await this.generateEmbedding(text);

    try {
      const res = await this.video_collection.query({
        queryEmbeddings: [userEmbedding],
        nResults: Number(limit),
      });

      return res.ids.map(id => id.toString());
      // .ids.map(id => id.toString());
    } catch (error) {
      logger.error("RecomandationSystem.getRecomandations", error);
      throw new Error("Failed to get recomandations");
    }
  }
}

export const recomandationSystem = new RecomandationSystem();
