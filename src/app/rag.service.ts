import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RagService {

  private apiUrl = 'https://chatbot-back-8qm9.onrender.com/rag'; 

  constructor(private http: HttpClient) {}

  // Method to send query to the backend and get response
  queryChatbot(query: string): Observable<any> {
      return this.http.post<any>(`${this.apiUrl}/query`, { query })
      .pipe(catchError(this.handleError));
;
  }

  // Method to store data embedding (optional step)
  embedData(text: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/embed`, { text })
    .pipe(catchError(this.handleError));
  }


getBrochure(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/brochure`)
  .pipe(catchError(this.handleError));
}

getInstitutionChild(childId: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/${childId}`)
  .pipe(catchError(this.handleError));
}

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
        console.error("An error occurred:", error.error.message);
    } else {
        console.error(
            `Backend returned code ${error.status}, ` +
                `body was: ${JSON.stringify(error.error)}`
        );
    }
    return throwError(`${error.status}`);
    // 'Something bad happened; please try again later.');
  }
}
