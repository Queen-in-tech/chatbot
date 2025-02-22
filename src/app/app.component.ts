import { Component,  ElementRef, ViewChild } from '@angular/core';

import { OpenAI } from 'openai';

import { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';
import { environment } from '../environments/environment';

import "pdfjs-dist/build/pdf.worker.min.mjs";

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RagService } from './rag.service';
// import { Document } from "langchain/document";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  openChatbot: boolean = false;
  typing = false;
  message: string = '';
  conversationState: 'welcome' | 'programType' | 'institution' | 'waec' | 'recommendation'| 'exit' = 'welcome';
  documents: { text: string, embedding: number[] }[] = [];
  relevantChunk: any;
  openai = new OpenAI({
    apiKey: environment.openaiApiKey,
    dangerouslyAllowBrowser: true,
  });

  schools: any;
  children: any[] =[]

  constructor(private http: HttpClient, private ragService: RagService) {
   
  }
  userResponses:any = {
    programType: 0,
    institutionType: 0,
    discipline: 0,
    waecResults: '',
    knowledgeBase: []
  };
  
institutions: any[] = []
programType = ['Degree awarding institutions', 'NCE', 'ND', 'NID'];
institutionTypes: any[] = []

async sendMessage() {
  if (!this.message) return;

  // Add user's message
  this.messages.push({ role: 'user', content: this.message });

  if(this.message === 'exit' ){
    this.conversationState = 'exit'
  }
  // Handle the conversation state
  switch (this.conversationState) {
    case 'welcome':
      this.handleWelcome();
      break;

    case 'programType':
      await this.handleProgramType();
      break;

    case 'institution':
      await this.handleInstitution();
      break;

    case 'waec':
      await this.handleWaecResult();
      break;

    case 'recommendation':
      await this.showRecommendations();
      break;

    case 'exit':
      this.exitChat();
      break;
    default:
      this.messages.push({ role: 'assistant', content: 'An unexpected error occurred.' });
  }
  // Clear user input
  this.message = '';
  this.scrollToBottom(); 

}

// Handle the 'welcome' state
handleWelcome() {
  this.messages.push({
    role: 'assistant',
    content: `Welcome! ${this.message.toLocaleUpperCase()}, Let’s find the best institution and course for you. <br> Please select a program type by entering the number corresponding to your choice:`
  });

  this.messages.push({
    role: 'assistant',
    content: this.programType.map((inst, index) => `${index + 1}. ${inst}`).join('<br>')
  });

  this.conversationState = 'programType';
}

// Handle the 'programType' state
async handleProgramType() {
  const selectedProgram = parseInt(this.message) - 1;

  if (selectedProgram >= 0 && selectedProgram < this.programType.length) {
    this.userResponses.programType = selectedProgram;

    this.messages.push({
      role: 'assistant',
      content: `You selected ${this.programType[selectedProgram]}. Please choose an institution type from the options below by entering the number corresponding to your choice:`
    });

    const availableInstitutionTypes = Object.values(this.institutionTypes[selectedProgram]).flat();

    this.messages.push({
      role: 'assistant',
      content: availableInstitutionTypes.map((child, index) => `${index + 1}: ${child}`).join('<br>')
    });

    this.conversationState = 'institution';
  } else {
    this.messages.push({ role: 'assistant', content: 'Invalid choice. Please select a valid program type.' });
  }
}

// Handle the 'institution' state
async handleInstitution() {
  const selectedInstitute = parseInt(this.message) - 1;

  if (selectedInstitute >= 0) {
    this.userResponses.institutionType = selectedInstitute;

    const institutionList: any = Object.values(this.institutionTypes[this.userResponses.programType])[0];

    this.messages.push({
      role: 'assistant',
      content: `You selected ${institutionList[selectedInstitute]}.`
    });

    this.messages.push({
      role: 'assistant',
      content: 'Please enter your WAEC result in the following format:<br> - Use subject names followed by a colon and the grade.<br> - Separate each subject-grade pair with a comma.<br>Example:<br> English: A1,<br> Mathematics: B2,<br> Physics: C4,<br> etc.'
    });

    this.conversationState = 'waec';
  } else {
    this.messages.push({ role: 'assistant', content: 'Invalid choice. Please select a valid institution from the list above.' });
  }
}

// Handle the 'waec' state
async handleWaecResult() {
  const result = this.message.trim();

  if (result.length > 0) {
    this.userResponses.waecResults = result;

    this.messages.push({
      role: 'assistant',
      content: `Please wait while I process your information...`
    });

    const choice = this.schools[this.userResponses.programType].children[this.userResponses.institutionType];

    for (const child of choice.children) {
      const data = await this.ragService.getInstitutionChild(child.id).toPromise();
      this.institutions.push(...data);
    }

    this.userResponses.knowledgeBase = this.institutions;
    this.conversationState = 'recommendation';

  this.message = '';

    await this.showRecommendations();


  } else {
    this.messages.push({
      role: 'assistant',
      content: `Invalid. Please follow the example format given above.`
    });
  }
}

exitChat() {
  // Reset to 'programType' state
  this.conversationState = 'programType';
  this.messages = [];
  this.message = '';
  this.userResponses = {
    programType: null,
    institutionType: null,
    waecResults: null,
    knowledgeBase: null,
  };

  // Restart the program type selection
  this.handleWelcome();
}
   ngOnInit() {
    try {
      this.ragService.getBrochure().subscribe(
        async (data) => {
          this.schools = data;
          // console.log('Schools loaded:', this.schools);
            this.schools.map((school: { name: string, children: any; }) => {
              const schoolChildren = school.children.map((child: any) => child.name)
                this.institutionTypes.push({ [school.name]: schoolChildren})
              
            })
            // console.log(this.institutionTypes)
        }
      );

      // console.log(this.institutions)
      // console.log(this.children)

    } catch (error) {
      console.error("Error processing the PDF:", error);
    }

 

  }

 checkEligibility(userResults: { [x: string]: string; }, courses: any[]) {
    return courses.filter(course => {
      const requiredSubjects = course.utme_requirements;
      const userGradesMatch = requiredSubjects.every((subject: string | number) => {
        return userResults[subject] && userResults[subject].match(/[A-B]/);  // Check if user has passed
      });
      return userGradesMatch;
    });
  }
  

  messages: ChatCompletionMessageParam[] = [
 
    {
      role: 'assistant',
      content: 'Hello, I am your JAMB advisor assistant',
    },
    {
      role: 'assistant',
      content: 'What can i call you?',
    },
  ];

async fetchCourses(selectedSchool: any) {
    selectedSchool.children.forEach(async (child: any) => {
      this.http.get<any[]>(`https://cors-anywhere.herokuapp.com/https://ibass.jamb.gov.ng/assets/content/courses-by-institution/${child.id}.json`).subscribe(
        async (data) => {
          // console.log(data)
         await this.institutions.push(...data);
        }
      );
    });
// console.log(this.institutions)
  this.userResponses.knowledgeBase = this.institutions
  // console.log(this.userResponses.knowledgeBase);

  }
  
  // Show the final recommendations based on user responses
  async showRecommendations() {
   
    try {
      // Log WAEC results and knowledge base
      // console.log('WAEC Results:', this.userResponses.waecResults);
      // console.log('Knowledge Base:', this.institutions);
  
      // Construct the system message dynamically
      const systemMessage: ChatCompletionMessageParam = {
        role: 'system',
        content: this.constructSystemMessage(),
      };
  
      // Call OpenAI API
      const openAIResponse = await this.openai.chat.completions.create({
        model: 'gpt-4',
        temperature: 0.8,
        max_tokens: 700,
        messages: [systemMessage, ...this.messages],
      });
  
      // Extract response content
      const responseContent = openAIResponse.choices[0]?.message?.content;
  
      if (!responseContent) {
        throw new Error('No response from OpenAI API');
      }
  
      // Log and push assistant's response
      // console.log('OpenAI Response:', responseContent);
      this.messages.push({ content: responseContent, role: 'assistant' });
    } catch (error) {
      console.error('Error in showRecommendations:', error);
      this.messages.push({
        role: 'assistant',
        content: 'An error occurred while generating recommendations. Please try again.',
      });
    }
  }
  
  // Helper function to construct the system message
  constructSystemMessage(): string {
    return `You are an AI chatbot specializing in providing courses and schools recommendations based on the knowledge base and WAEC results provided. 
When creating responses:
1. Organize recommendations into an HTML ordered list.
2. Use proper line breaks (<br>) to separate information.
3. Include clickable hyperlinks for courses and institutions.
4. Use bold text to highlight key parts like "Course Name," "Institution," and section headers (e.g., "Direct Entry Requirements").
5. Break down requirements (like UTME and Direct Entry) into simple, clear bullet points (<ul><li>...</li></ul>) for easy readability.
3. Always ensure the response is visually scannable and user-friendly.
Here is the knowledge base: ${JSON.stringify(this.institutions)}. Here is the WAEC result: ${JSON.stringify(this.userResponses.waecResults)}.
Provide recommendations based on the above data.`;
  }
  

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }, 0);
  }
 
}



 
