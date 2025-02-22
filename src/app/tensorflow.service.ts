import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

@Injectable({
  providedIn: 'root'
})
export class TensorflowService {
  private model: use.UniversalSentenceEncoder | undefined
 
  constructor() {}

  // Load the model once when initializing the service
  async loadModel() {
    try {
      // Explicitly set the backend (e.g., 'webgl' or 'cpu')
      await tf.setBackend('webgl'); // You can use 'cpu' or 'wasm' if needed
      console.log('Loading TensorFlow model...');
      this.model = await use.load();
      console.log('TensorFlow model loaded');
    } catch (error) {
      console.error('Error loading the model:', error);
    }
  }
  

  // Generate embeddings for an array of texts (documents or queries)
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.model) {
      throw new Error('Model is not loaded');
    }
  
    // Log the input texts to ensure they're correct
  
    // Generate embeddings
    const embeddings = await this.model.embed(texts);
  
    // Convert to array
    const embeddingsArray = embeddings.arraySync() as number[][];
  
    // Log the embeddings to debug
  
    return embeddingsArray;
  }

  // Calculate cosine similarity between two vectors
  calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      console.error('Error: Vectors must be of the same length');
      return -1; // Return a negative value to indicate an error
    }
  
    const dotProduct = vec1.reduce((sum, value, index) => sum + value * vec2[index], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, value) => sum + value ** 2, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, value) => sum + value ** 2, 0));
  
    if (magnitude1 === 0 || magnitude2 === 0) {
      console.error('Error: One of the vectors has zero magnitude');
      return -1; // Return a negative value to indicate an error
    }
  
    return dotProduct / (magnitude1 * magnitude2);
  }
  

  // Dot product of two vectors
  private dotProduct(vector1: number[], vector2: number[]): number {
    return vector1.reduce((sum, value, i) => sum + value * vector2[i], 0);
  }

  // Magnitude of a vector
  private magnitude(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  }
}
