import { Component } from '@angular/core';
import AOS from 'aos';
import { OpenAI } from 'openai';
import { OpenaiService } from './openai.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';
import { environment } from '../environments/environment';
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min.mjs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { HttpClient } from '@angular/common/http';
// import { Document } from "langchain/document";


interface SchoolDocument {
  id: string; // assuming id exists
  fullName: string;
  abbreviation: string;
  address: string;
  website: string;
  email: string;
  tel: string;
  metadata: {
    embedding: number[]; // store embedding in metadata
  };
  pageContent: string;
}
class Document<T> {
  pageContent: string;
  metadata: T;
  abbreviation: string;
  fullName: string;
  address: string;
  tel: string;
  website: string;
  email: string;
  constructor(data: { pageContent: string; metadata: T, abbreviation: string, fullName: string; address: string; tel: string, website: string; email: string}) {
    this.pageContent = data.pageContent;
    this.metadata = data.metadata;
    this.abbreviation = data.abbreviation,
    this.fullName = data.fullName,
    this.address = data.address,
    this.tel = data.tel,
    this.website = data.website,
    this.email = data.email
  }
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  openChatbot: boolean = false;
  typing = false;
  message: string = '';
  documents: { text: string, embedding: number[] }[] = [];
  relevantChunk: any;

  openai = new OpenAI({
    apiKey: environment.openaiApiKey,
    dangerouslyAllowBrowser: true,
  });
  schools: any;
  constructor(private http: HttpClient){

  }


async ngOnInit() {
  try {
    this.http.get<any[]>('/inno-list-of-schools.json').subscribe(
      async (data) => {
        this.schools = data;
        console.log('Schools loaded:', this.schools);

        // Combine all school data into text content for embedding
        const textContent = this.schools
          .map(
            (school: {
              abbreviation: string;
              fullName: string;
              address: string;
              tel: string;
              email: string;
              website: string;
            }) =>
              `Abbreviation: ${school.abbreviation}\nFull Name: ${school.fullName}\nAddress: ${school.address}\nTel: ${school.tel || 'N/A'}\nEmail: ${school.email || 'N/A'}\nWebsite: ${school.website || 'N/A'}`
          )
          .join("\n\n");

        // Split the content into smaller chunks
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1500,
          chunkOverlap: 250,
          separators: ["\r\n\r\n", "\n\n", "\n", " ", ""],
        });

        const docs = await splitter.createDocuments([textContent]);
        console.log('Split documents:', docs);

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: environment.openaiApiKey,
        });

        const embeddedDocs: any = []; // Add metadata structure type here

        // Iterate over docs and create documents with embedding and metadata
        for (const school of this.schools) {
          const embedding = await embeddings.embedQuery(school.fullName + " " + school.address); // Adjust embedding logic if needed
          
          const doc = new Document({
            pageContent: `${school.fullName} ${school.address}`, // You can choose the text to embed
            metadata: {
              embedding, // The embedding for the document
              abbreviation: school.abbreviation,
              fullName: school.fullName,
              address: school.address,
              tel: school.tel,
              website: school.website,
              email: school.email,
            },
            abbreviation: school.abbreviation,
              fullName: school.fullName,
              address: school.address,
              tel: school.tel,
              website: school.website,
              email: school.email,
          });

          embeddedDocs.push(doc);
        }

        console.log('Embedded documents:', embeddedDocs);

        // Now store the embedded documents with their metadata
        await this.storeSchoolDataWithEmbedding(embeddedDocs);
      }
    );
  } catch (error) {    console.error("Error processing the PDF:", error);
  }
}

  
  storeEmbeddingsLocally(embeddedDocs: any): void {
    const dbName = 'school_embeddings_db';  // Database name
    const storeName = 'embeddings';         // Object store name
    let db;
  
    // Open the database with a specific version. Incrementing version forces the upgrade.
    const request = indexedDB.open(dbName, 2); // Version 2 (if you already have version 1, this will trigger onupgradeneeded)
  
    // Error handler for the database open request
    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
    };
  
    // This event is triggered when the database is upgraded (or created for the first time)
    request.onupgradeneeded = (event) => {
      const dbRequest = event.target as IDBRequest;
      db = dbRequest.result;
  
      console.log('onupgradeneeded triggered');
      console.log('Current object stores:', db.objectStoreNames);
  
      if (!db.objectStoreNames.contains(storeName)) {
        // Create the object store if it doesn't exist
        const objectStore = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        console.log('Object store created:', storeName);
      } else {
        console.log('Object store already exists.');
      }
    };
  
    // Success handler once the database is successfully opened
    request.onsuccess = (event) => {
      const dbRequest = event.target as IDBRequest;
      db = dbRequest.result;
  
      // Perform the transaction to add documents
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
  
      // Add documents to the object store
      embeddedDocs.forEach((doc: { pageContent: any; metadata: any; }) => {
        store.add({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
        });
      });
  
      // Handle transaction completion
      transaction.oncomplete = () => {
        console.log('Documents successfully added to IndexedDB');
      };
  
      transaction.onerror = (error: any) => {
        console.error('Error during transaction:', error);
      };
    };
  }
  
  // Function to store school data with embedding in IndexedDB
async storeSchoolDataWithEmbedding(school: {
  abbreviation: string;
  fullName: string;
  address: string;
  tel: string;
  website: string;
  email: string;
}) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: environment.openaiApiKey,
  });

  // Create embedding for the school
  const schoolText = `${school.abbreviation} ${school.fullName} ${school.address}`;
  const schoolEmbedding = await embeddings.embedQuery(schoolText);

  const storeDocument = {
    metadata: {
      abbreviation: school.abbreviation,
      fullName: school.fullName,
      address: school.address,
      website: school.website,
      email: school.email,
      tel: school.tel
    },
    embedding: schoolEmbedding, // The numeric embedding
  };

  const dbName = 'school_embeddings_db';
  const storeName = 'embeddings';

  const request = indexedDB.open(dbName, 1);
  
  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBRequest).result;
    if (!db.objectStoreNames.contains(storeName)) {
      const store = db.createObjectStore(storeName, { keyPath: 'abbreviation' });
      store.createIndex('embedding', 'embedding');
    }
  };

  request.onsuccess = (event) => {
    const db = (event.target as IDBRequest).result;
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(storeDocument);

    transaction.oncomplete = () => {
      console.log('School data stored successfully');
    };
  };

  request.onerror = (event) => {
    console.error('Error storing school data:', event);
  };
}

  
  // Cosine similarity function to compare embeddings
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
    return dotProduct / (mag1 * mag2);
  }




messages: ChatCompletionMessageParam[] = [
 
  {
    role: 'assistant',
    content: 'Hello, I am your AI chat assistant',
  },
  {
    role: 'assistant',
    content: 'How can I help you today?',
  },
];
async searchForRelevantInformation(query: string): Promise<string | number[] | null> {
  // Search in the in-memory schools list first
  const normalizedQuery = query.toLowerCase();
  const relevantSchool = this.schools?.find((school: {
    tel: any;
    website: any;
    email: any;
    abbreviation: string;
    fullName: string;
    address: string; 
  }) => 
    (school.abbreviation?.toLowerCase().includes(normalizedQuery)) ||
    (school.fullName?.toLowerCase().includes(normalizedQuery)) ||
    (school.address?.toLowerCase().includes(normalizedQuery)) ||
    (typeof school.website === 'string' && school.website.toLowerCase().includes(normalizedQuery)) ||
    (typeof school.email === 'string' && school.email.toLowerCase().includes(normalizedQuery))
  );

  console.log(relevantSchool);

  if (relevantSchool) {
    // If relevant school is found, return the school name (or any other string you'd like)
    return relevantSchool.fullName;  // You can choose a different property like abbreviation, address, etc.
  } else {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: environment.openaiApiKey,
    });
    
    const queryEmbedding = await embeddings.embedQuery(query);
    const mostRelevantDoc = await this.searchEmbeddingsInDB(queryEmbedding);

    // Return the embedding or null if no document is found
    return mostRelevantDoc?.metadata?.['embedding'] || null;
  }
}


async searchEmbeddingsInDB(queryEmbedding: number[]): Promise<SchoolDocument | null> {
  const dbName = 'school_embeddings_db';
  const storeName = 'embeddings';

  return new Promise<SchoolDocument | null>((resolve, reject) => {
    const request = indexedDB.open(dbName, 2); // Open the DB with version 2

    let db: IDBDatabase;

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const dbRequest = event.target as IDBRequest;
      db = dbRequest.result;

      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const allDocsRequest = store.getAll();

      allDocsRequest.onsuccess = () => {
        const allDocs = allDocsRequest.result;
        let mostRelevantDoc: SchoolDocument | null = null;
        let highestSimilarity = -1;

        allDocs.forEach((doc: SchoolDocument) => {
          const similarity = this.cosineSimilarity(queryEmbedding, doc.metadata['embedding']);
          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            mostRelevantDoc = doc;
          }
        });

        // Return the most relevant document with school data
        if (mostRelevantDoc) {
          resolve(mostRelevantDoc);
        } else {
          resolve(null);
        }
      };

      allDocsRequest.onerror = (error) => {
        console.error('Error fetching documents from IndexedDB:', error);
        reject('Error fetching documents');
      };
    };

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
      reject('Error opening IndexedDB');
    };
  });
}





async sendMessage() {
  if (!this.message.trim()) return;

  this.messages.push({ content: this.message, role: 'user' });
  // this.message = ''; 
  this.typing = true;

  try {
    let responseContent = await this.searchForRelevantInformation(this.message);
    console.log(responseContent)

    const systemMessage: ChatCompletionMessageParam = {
      role: 'system',
      content: `You are an AI chatbot specializing in answering questions about schools based on provided information. here is the knowledge base: ${JSON.stringify(responseContent)}, When answering a query:
1. If the query does not match exactly but is similar to an entry in the knowledge base, suggest the closest match. For example, say: "Did you mean [closest match]?".
2. If there is no close match in the knowledge base, respond with: "Sorry, I do not have an answer to the question you asked. Could you please rephrase your query for better assistance?"
3. Always prioritize clarity and relevance in your response.`,
    };
    console.log(systemMessage)
      const openAIResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 50,
        messages: [systemMessage, ...this.messages],
      });
      responseContent = openAIResponse.choices[0]?.message?.content ;
    

    this.messages.push({ content: responseContent, role: 'assistant' });
  } catch (error) {
    console.error('Error processing the query:', error);
    this.messages.push({ content: 'An error occurred while processing your request.', role: 'assistant' });
  } finally {
    this.typing = false;
  }
}



 
}