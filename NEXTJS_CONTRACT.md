🎯 ReadyRoad Next.js Web App - BDD Contract
📄 File: NEXTJS_CONTRACT.md
text
# ReadyRoad Next.js Web Application - BDD Contract

**Project:** ReadyRoad Belgian Driving License Platform  
**Component:** Next.js 14 Web Application  
**Backend API:** Spring Boot REST API (localhost:8890)  
**Architecture:** App Router, TypeScript, Server Components + Client Components  
**Security:** JWT-based Authentication  
**Testing:** BDD Style (Given/When/Then)  

---

## Table of Contents

1. [Authentication & Security](#1-authentication--security)
2. [Exam Simulation Engine](#2-exam-simulation-engine)
3. [Analytics Dashboard (Feature C)](#3-analytics-dashboard-feature-c)
4. [Progress Tracking](#4-progress-tracking)
5. [Public Content (SEO)](#5-public-content-seo)
6. [Multi-Language Support](#6-multi-language-support)
7. [Technical Requirements](#7-technical-requirements)

---

## 1. Authentication & Security

### Feature 1.1: JWT Authentication

**Epic:** As a user, I need secure authentication to access personalized features.

**Backend Contract:**
- Endpoint: `POST /api/auth/login`
- Request Body:
  ```json
  {
    "username": "test@readyroad.be",
    "password": "SecurePass123"
  }
Success Response (200):

json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "expiresIn": 86400
}
Error Response (401):

json
{
  "error": "Invalid credentials"
}
BDD Scenario 1.1.1: Successful Login

text
Feature: User Authentication
  As a ReadyRoad user
  I want to login with my credentials
  So that I can access my personalized dashboard

  Background:
    Given the backend API is running on "http://localhost:8890"
    And the database contains a user with username "test@readyroad.be" and password "SecurePass123"

  Scenario: Successful login with valid credentials
    Given I am on the login page "/login"
    When I enter "test@readyroad.be" in the username field
    And I enter "SecurePass123" in the password field
    And I click the "Login" button
    Then I should see a loading indicator
    And the system should send POST request to "/api/auth/login"
    And the system should receive a JWT token
    And the token should be stored in localStorage with key "auth_token"
    And I should be redirected to "/dashboard"
    And I should see "Welcome back" message

  Scenario: Failed login with invalid credentials
    Given I am on the login page "/login"
    When I enter "wrong@email.com" in the username field
    And I enter "wrongpassword" in the password field
    And I click the "Login" button
    Then the system should send POST request to "/api/auth/login"
    And the system should receive a 401 Unauthorized response
    And I should see error message "Invalid credentials"
    And I should remain on the login page
    And no token should be stored in localStorage

  Scenario: Login with empty fields
    Given I am on the login page "/login"
    When I leave the username field empty
    And I leave the password field empty
    And I click the "Login" button
    Then I should see validation error "Username is required"
    And I should see validation error "Password is required"
    And no API request should be sent
BDD Scenario 1.1.2: Token Expiry Handling

text
Feature: Token Expiry and Auto-Logout
  As a security measure
  I want expired tokens to trigger automatic logout
  So that unauthorized access is prevented

  Scenario: Access protected route with expired token
    Given I am logged in
    And my JWT token has expired
    When I navigate to "/dashboard"
    Then the system should send GET request to "/api/users/me"
    And the system should receive a 401 Unauthorized response
    And the token should be removed from localStorage
    And I should be redirected to "/login"
    And I should see message "Session expired. Please login again."

  Scenario: API request with expired token
    Given I am on "/exam" page
    And my JWT token has expired
    When the page tries to fetch exam data
    Then the axios interceptor should catch the 401 error
    And the system should clear localStorage
    And I should be redirected to "/login"
    And I should see message "Session expired. Please login again."
BDD Scenario 1.1.3: Protected Routes

text
Feature: Protected Route Access
  As a security measure
  I want unauthenticated users blocked from protected pages
  So that sensitive data is secure

  Scenario: Access protected route without login
    Given I am not logged in
    And no token exists in localStorage
    When I try to navigate to "/dashboard"
    Then the middleware should check for auth token
    And the middleware should find no token
    And I should be redirected to "/login"
    And I should see message "Please login to continue"

  Scenario: Access protected route with valid token
    Given I am logged in with a valid JWT token
    When I navigate to "/dashboard"
    Then the middleware should check for auth token
    And the middleware should find a valid token
    And I should be allowed to access "/dashboard"
    And I should see my dashboard content

  Scenario Outline: Protected routes verification
    Given I am not logged in
    When I try to access "<route>"
    Then I should be redirected to "/login"

    Examples:
      | route                  |
      | /dashboard             |
      | /exam                  |
      | /exam/123              |
      | /analytics/errors      |
      | /analytics/weak-areas  |
      | /progress              |
      | /profile               |
Feature 1.2: API Client Configuration
Epic: As a developer, I need a centralized API client for consistent backend communication.

BDD Scenario 1.2.1: API Client Setup

text
Feature: Axios API Client Configuration
  As a developer
  I want a configured axios instance
  So that all API calls are consistent and secure

  Scenario: API client initialization
    Given the Next.js application starts
    When the API client module is loaded
    Then it should be configured with:
      | Property          | Value                              |
      | baseURL           | http://localhost:8890/api          |
      | timeout           | 10000                              |
      | Content-Type      | application/json                   |
      | withCredentials   | false                              |

  Scenario: Request interceptor adds JWT token
    Given the API client is initialized
    And a valid token "abc123token" exists in localStorage
    When any API request is made
    Then the request interceptor should run
    And the Authorization header should be added
    And the header value should be "Bearer abc123token"

  Scenario: Request without token
    Given the API client is initialized
    And no token exists in localStorage
    When any API request is made to a public endpoint
    Then the request interceptor should run
    And no Authorization header should be added
    And the request should proceed normally
BDD Scenario 1.2.2: Response Interceptor Error Handling

text
Feature: Axios Response Interceptor
  As a developer
  I want automatic error handling
  So that authentication errors are handled consistently

  Scenario Outline: Error response handling
    Given the API client is initialized
    When a request returns status code <status>
    Then the response interceptor should catch the error
    And the action should be "<action>"

    Examples:
      | status | action                                    |
      | 401    | Clear token, redirect to /login           |
      | 403    | Show "Access forbidden" error             |
      | 404    | Show "Resource not found" error           |
      | 500    | Show "Server error, please try again"     |
      | 503    | Show "Service unavailable"                |

  Scenario: Successful response passes through
    Given the API client is initialized
    When a request returns status code 200
    Then the response interceptor should run
    And the response data should be returned unchanged
    And no error should be thrown
Feature 1.3: User Profile (/me endpoint)
Backend Contract:

Endpoint: GET /api/users/me

Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "id": 1,
  "username": "test@readyroad.be",
  "email": "test@readyroad.be",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "createdAt": "2024-01-15T10:30:00Z"
}
BDD Scenario 1.3.1: Fetch User Profile

text
Feature: User Profile Display
  As a logged-in user
  I want to see my profile information
  So that I can verify my account details

  Scenario: Successful profile fetch
    Given I am logged in with a valid JWT token
    When I navigate to "/dashboard"
    Then the system should send GET request to "/api/users/me"
    And the request should include header "Authorization: Bearer <token>"
    And the system should receive status code 200
    And the response should contain:
      | Field     | Example Value         |
      | username  | test@readyroad.be     |
      | email     | test@readyroad.be     |
      | firstName | John                  |
      | lastName  | Doe                   |
      | role      | STUDENT               |
    And the profile data should be stored in React Context
    And I should see "John Doe" displayed in the navbar

  Scenario: Profile fetch with invalid token
    Given I am on "/dashboard"
    And I have an invalid JWT token
    When the page loads
    Then the system should send GET request to "/api/users/me"
    And the system should receive status code 401
    And the error interceptor should trigger
    And I should be redirected to "/login"
2. Exam Simulation Engine
Feature 2.1: Start Exam Simulation
Backend Contract:

Endpoint: POST /api/users/me/simulations

Headers: Authorization: Bearer <token>

Request Body:

json
{
  "type": "FULL_EXAM"
}
Success Response (201):

json
{
  "simulationId": 42,
  "totalQuestions": 50,
  "timeLimitMinutes": 45,
  "passingScore": 41,
  "startedAt": "2024-01-23T09:00:00Z",
  "expiresAt": "2024-01-23T09:45:00Z",
  "questions": [
    {
      "id": 123,
      "questionTextEn": "What does this sign mean?",
      "questionTextAr": "ماذا تعني هذه الإشارة؟",
      "questionTextNl": "Wat betekent dit bord?",
      "questionTextFr": "Que signifie ce panneau?",
      "imageUrl": "/images/signs/a1a.png",
      "categoryCode": "DANGER_SIGNS",
      "difficulty": "MEDIUM",
      "options": [
        {
          "number": 1,
          "textEn": "Sharp right turn ahead",
          "textAr": "منعطف حاد لليمين",
          "textNl": "Scherpe bocht naar rechts",
          "textFr": "Virage serré à droite"
        },
        {
          "number": 2,
          "textEn": "Road narrows on the right",
          "textAr": "الطريق يضيق على اليمين",
          "textNl": "Weg wordt smaller rechts",
          "textFr": "Chaussée rétrécie à droite"
        },
        {
          "number": 3,
          "textEn": "Right lane ends",
          "textAr": "المسار الأيمن ينتهي",
          "textNl": "Rechterrijstrook eindigt",
          "textFr": "Voie de droite se termine"
        }
      ]
    }
  ]
}
BDD Scenario 2.1.1: Start New Exam

text
Feature: Exam Simulation Creation
  As a ReadyRoad user
  I want to start a simulated exam
  So that I can practice under real conditions

  Background:
    Given I am logged in as "test@readyroad.be"
    And I am on the exam page "/exam"

  Scenario: Start exam with Belgian rules
    Given I see the exam rules displayed:
      """
      Belgian Driving License Exam Rules:
      -  50 questions (randomly selected)
      -  45 minutes time limit
      -  Pass: 41/50 correct (82%)
      -  No answer reveal during exam
      -  Exam cannot be paused
      -  Auto-submit when time expires
      """
    When I click the "Start Exam" button
    Then the system should send POST request to "/api/users/me/simulations"
    And the request body should contain:
      ```json
      {
        "type": "FULL_EXAM"
      }
      ```
    And the system should receive status code 201
    And the response should contain simulationId
    And the response should contain 50 questions
    And I should be redirected to "/exam/[simulationId]"
    And the exam timer should start immediately
    And the timer should display "45:00"

  Scenario: Start exam when already in progress
    Given I have an active exam with simulationId 42
    And the exam is not yet submitted
    When I try to start a new exam
    Then I should see a warning dialog:
      """
      You have an exam in progress.
      Starting a new exam will forfeit your current attempt.
      
      Continue with current exam?
      [Continue Current] [Start New]
      """
    When I click "Continue Current"
    Then I should be redirected to "/exam/42"
BDD Scenario 2.1.2: Exam Rules Display

text
Feature: Exam Rules Presentation
  As a user about to start an exam
  I want to understand the exam rules
  So that I know what to expect

  Scenario: Rules displayed before exam start
    Given I am on "/exam"
    And I am not in an active exam
    Then I should see a rules section with:
      | Rule                    | Value               |
      | Total Questions         | 50                  |
      | Time Limit              | 45 minutes          |
      | Passing Score           | 41/50 (82%)         |
      | Answer Reveal           | After submission    |
      | Pause Allowed           | No                  |
      | Multiple Attempts       | Yes (1 per day max) |
    And I should see a "Start Exam" button
    And the button should be enabled

  Scenario: Exam limit reached
    Given I have already taken 1 exam today
    And the daily limit is 1 exam
    When I navigate to "/exam"
    Then the "Start Exam" button should be disabled
    And I should see message "Daily exam limit reached. Try again tomorrow."
    And I should see my next available time
Feature 2.2: Question Navigation & Answering
BDD Scenario 2.2.1: Display Question

text
Feature: Exam Question Display
  As a user taking an exam
  I want to see questions clearly
  So that I can answer accurately

  Background:
    Given I am in an active exam with simulationId 42
    And the exam has 50 questions
    And my selected language is "EN"

  Scenario: Display first question
    Given I just started the exam
    When the exam page loads
    Then I should be on question number 1
    And I should see:
      | Element           | Content                          |
      | Question Number   | "Question 1 of 50"               |
      | Progress Bar      | 2% filled (1/50)                 |
      | Question Text     | English text                     |
      | Image             | Sign image (if applicable)       |
      | Options Count     | 3 radio buttons                  |
      | Timer             | Countdown (e.g., "44:32")        |
      | Navigation        | "Next" button (enabled)          |
      | Navigation        | "Previous" button (disabled)     |
      | Overview Button   | "Overview" (enabled)             |

  Scenario: Display question with image
    Given I am on question 5
    And question 5 has an image "/images/signs/a1a.png"
    When the question loads
    Then I should see the sign image
    And the image should be centered
    And the image should have alt text
    And the image should be clickable to zoom

  Scenario: Display question in Arabic (RTL)
    Given my selected language is "AR"
    When I view any question
    Then the question text should be in Arabic
    And the text direction should be RTL (right-to-left)
    And options should be aligned right
    And navigation buttons should be in RTL order
BDD Scenario 2.2.2: Answer Selection

text
Feature: Answer Selection
  As a user taking an exam
  I want to select answers easily
  So that I can record my responses

  Scenario: Select an answer
    Given I am on question 5
    And no answer is selected
    When I click on option 2
    Then option 2 radio button should be checked
    And the question should be marked as "answered" in state
    And the "Next" button should remain enabled
    And no API request should be sent (local state only)

  Scenario: Change answer
    Given I am on question 5
    And I have selected option 2
    When I click on option 3
    Then option 3 should be selected
    And option 2 should be deselected
    And the answer should update in local state

  Scenario: Navigate to next question after answering
    Given I am on question 5
    And I have selected option 2
    When I click the "Next" button
    Then I should move to question 6
    And the previous answer should be saved in state
    And question 5 should show as "answered" in overview
BDD Scenario 2.2.3: Question Navigation

text
Feature: Exam Navigation
  As a user taking an exam
  I want to navigate between questions freely
  So that I can review and change answers

  Scenario: Navigate forward
    Given I am on question 5
    When I click the "Next" button
    Then I should move to question 6
    And the URL should update to include question 6
    And the progress bar should update to 12% (6/50)
    And the "Previous" button should be enabled

  Scenario: Navigate backward
    Given I am on question 6
    When I click the "Previous" button
    Then I should move to question 5
    And my previous answer should still be selected

  Scenario: Navigate to last question
    Given I am on question 49
    When I click the "Next" button
    Then I should move to question 50
    And the "Next" button should be replaced with "Submit Exam" button

  Scenario: Jump to specific question via overview
    Given I am on question 5
    When I click the "Overview" button
    Then I should see a modal/panel with a 50-question grid
    And each question should have a status indicator:
      | Status      | Visual        |
      | Answered    | Green circle  |
      | Unanswered  | Gray circle   |
      | Current     | Blue border   |
    When I click on question 30
    Then the overview should close
    And I should navigate to question 30
BDD Scenario 2.2.4: Question Overview Grid

text
Feature: Question Overview
  As a user taking an exam
  I want to see which questions I've answered
  So that I can manage my time and ensure completeness

  Scenario: Display overview grid
    Given I am in an active exam
    And I have answered questions: 1, 2, 5, 10
    When I click the "Overview" button
    Then I should see a grid layout with 50 circles (5 rows × 10 columns)
    And circles should have colors:
      | Question | Color | Status     |
      | 1        | Green | Answered   |
      | 2        | Green | Answered   |
      | 3        | Gray  | Unanswered |
      | 4        | Gray  | Unanswered |
      | 5        | Green | Answered   |
    And the current question should have a blue border

  Scenario: Close overview
    Given the overview panel is open
    When I click outside the panel
    Or I press the Escape key
    Then the overview should close
    And I should return to the current question
Feature 2.3: Timer Management
BDD Scenario 2.3.1: Timer Display

text
Feature: Exam Timer
  As a user taking an exam
  I want an accurate countdown timer
  So that I can manage my time effectively

  Scenario: Timer starts on exam start
    Given I start a new exam
    When the first question loads
    Then the timer should display "45:00"
    And the timer should count down every second
    And the timer should be visible at all times

  Scenario: Timer countdown accuracy
    Given the exam started at 09:00:00
    And the current time is 09:05:00
    When I check the timer
    Then it should display "40:00"

  Scenario: Timer persists across page refresh
    Given I am in an active exam
    And 10 minutes have elapsed
    And the timer shows "35:00"
    When I refresh the page
    Then the timer should recalculate based on start time
    And it should display approximately "35:00"
    And the countdown should resume

  Scenario: Timer stored in localStorage
    Given I am in an active exam with simulationId 42
    Then localStorage should contain:
      | Key                  | Value Type  |
      | exam_42_start_time   | ISO string  |
      | exam_42_expires_at   | ISO string  |
BDD Scenario 2.3.2: Timer Warning

text
Feature: Timer Warning System
  As a user taking an exam
  I want warnings when time is running low
  So that I can prioritize remaining questions

  Scenario: 5-minute warning
    Given I am in an active exam
    When the timer reaches "05:00"
    Then the timer should change color to orange
    And I should see a notification "5 minutes remaining!"
    And the notification should auto-dismiss after 3 seconds

  Scenario: 1-minute critical warning
    Given I am in an active exam
    When the timer reaches "01:00"
    Then the timer should change color to red
    And the timer should start blinking
    And I should see a notification "Only 1 minute left!"
BDD Scenario 2.3.3: Time Expiry

text
Feature: Exam Auto-Submit on Time Expiry
  As the system
  I want to auto-submit exams when time expires
  So that the 45-minute limit is enforced

  Scenario: Timer reaches zero
    Given I am in an active exam with simulationId 42
    And I have answered 45/50 questions
    When the timer reaches "00:00"
    Then the exam should auto-submit immediately
    And a PUT request should be sent to "/api/users/me/simulations/42"
    And the request body should contain all my answers
    And I should see a modal "Time expired - Exam submitted"
    And I should be redirected to "/exam/results/42" after 3 seconds

  Scenario: Attempt to answer after time expiry
    Given the timer has reached "00:00"
    And the exam has auto-submitted
    When I try to select an answer
    Then the radio buttons should be disabled
    And I should see message "Exam has ended"
Feature 2.4: Exam Submission
Backend Contract:

Endpoint: PUT /api/users/me/simulations/{simulationId}

Headers: Authorization: Bearer <token>

Request Body:

json
{
  "answers": [
    {
      "questionId": 123,
      "selectedOption": 2
    },
    {
      "questionId": 124,
      "selectedOption": 1
    }
  ]
}
Success Response (200):

json
{
  "simulationId": 42,
  "score": 43,
  "totalQuestions": 50,
  "passed": true,
  "completedAt": "2024-01-23T09:38:24Z"
}
BDD Scenario 2.4.1: Manual Submit

text
Feature: Manual Exam Submission
  As a user taking an exam
  I want to submit my exam manually
  So that I can finish early if desired

  Scenario: Submit with all questions answered
    Given I am in an active exam with simulationId 42
    And I have answered all 50 questions
    When I click the "Submit Exam" button
    Then I should see a confirmation modal:
      """
      Submit Exam
      
      You have answered 50/50 questions.
      
      Once submitted, you cannot change your answers.
      Are you sure you want to submit?
      
      [Cancel] [Submit]
      """
    When I click "Submit"
    Then the system should send PUT request to "/api/users/me/simulations/42"
    And the request body should contain all 50 answers
    And I should see a loading indicator "Submitting..."
    And the system should receive status code 200
    And I should be redirected to "/exam/results/42"

  Scenario: Submit with unanswered questions
    Given I am in an active exam
    And I have answered 45/50 questions
    And 5 questions are unanswered
    When I click the "Submit Exam" button
    Then I should see a confirmation modal:
      """
      Submit Exam
      
      You have answered 45/50 questions.
      5 questions are unanswered (will count as incorrect).
      
      Are you sure you want to submit?
      
      [Cancel] [Submit]
      """
    When I click "Cancel"
    Then the modal should close
    And I should remain in the exam

  Scenario: Submit button availability
    Given I am in an active exam
    And I am on question 1
    Then the "Submit Exam" button should not be visible
    When I navigate to question 50
    Then the "Submit Exam" button should be visible
    And the "Next" button should not be visible
BDD Scenario 2.4.2: Submission Error Handling

text
Feature: Exam Submission Error Handling
  As the system
  I want to handle submission errors gracefully
  So that users don't lose their work

  Scenario: Network error during submission
    Given I am submitting my exam
    When the network connection fails
    Then I should see error "Network error. Please check your connection."
    And the exam should NOT be marked as submitted locally
    And I should see a "Retry" button
    When I click "Retry"
    Then the submission should be attempted again

  Scenario: Server error during submission
    Given I am submitting my exam
    When the server returns status code 500
    Then I should see error "Server error. Your answers are saved locally."
    And my answers should be preserved in localStorage
    And I should see a "Retry" button
    When I click "Retry"
    Then the submission should be attempted again

  Scenario: Prevent double submission
    Given I click "Submit Exam"
    And the submission is in progress
    When I try to click "Submit" again
    Then the button should be disabled
    And I should see loading indicator
    And only one API request should be sent
3. Analytics Dashboard (Feature C)
Feature 3.1: Exam Results Display
Backend Contract:

Endpoint: GET /api/users/me/simulations/{simulationId}/results

Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "simulationId": 42,
  "score": 43,
  "totalQuestions": 50,
  "percentage": 86.0,
  "passed": true,
  "passingScore": 41,
  "completedAt": "2024-01-23T09:38:24Z",
  "timeTaken": "38:24",
  "categoryBreakdown": [
    {
      "categoryCode": "DANGER_SIGNS",
      "categoryName": "Danger Signs",
      "correct": 8,
      "total": 10,
      "percentage": 80.0
    },
    {
      "categoryCode": "PRIORITY_RULES",
      "categoryName": "Priority Rules",
      "correct": 7,
      "total": 8,
      "percentage": 87.5
    }
  ]
}
BDD Scenario 3.1.1: Display Pass Result

text
Feature: Exam Results - Pass
  As a user who passed the exam
  I want to see my results immediately
  So that I can celebrate my success

  Background:
    Given I completed exam with simulationId 42
    And I scored 43/50 (86%)
    And the passing score is 41/50 (82%)

  Scenario: Display pass results
    Given the exam has been submitted successfully
    When I am redirected to "/exam/results/42"
    Then the page should fetch results from "/api/users/me/simulations/42/results"
    And I should see:
      | Element         | Value                          |
      | Status Badge    | "PASSED ✅" (green background) |
      | Score           | "43 / 50"                      |
      | Percentage      | "86%"                          |
      | Pass Indicator  | "You passed! 🎉"               |
      | Passing Score   | "Required: 41/50 (82%)"        |
      | Time Taken      | "38 minutes 24 seconds"        |
    And I should see a "View Detailed Analytics" button
    And I should see a "Take Another Exam" button

  Scenario: Category breakdown display
    Given I am on the results page
    When I scroll to the "Category Performance" section
    Then I should see a table:
      | Category          | Correct | Total | Percentage | Status    |
      | Danger Signs      | 8       | 10    | 80%        | Good ✅   |
      | Priority Rules    | 7       | 8     | 87.5%      | Strong ✅ |
      | Speed Limits      | 6       | 7     | 85.7%      | Strong ✅ |
      | Parking Rules     | 5       | 8     | 62.5%      | Weak ⚠️   |
    And weak categories should be highlighted in yellow
BDD Scenario 3.1.2: Display Fail Result

text
Feature: Exam Results - Fail
  As a user who failed the exam
  I want to see my results and areas to improve
  So that I can prepare better for the next attempt

  Background:
    Given I completed exam with simulationId 43
    And I scored 38/50 (76%)
    And the passing score is 41/50 (82%)

  Scenario: Display fail results
    When I am redirected to "/exam/results/43"
    Then I should see:
      | Element         | Value                              |
      | Status Badge    | "NOT PASSED ❌" (red background)   |
      | Score           | "38 / 50"                          |
      | Percentage      | "76%"                              |
      | Gap             | "You need 3 more correct answers"  |
      | Passing Score   | "Required: 41/50 (82%)"            |
      | Encouragement   | "Keep practicing! You're close."   |
    And I should see a "View Error Analysis" button (prominent)
    And I should see a "Study Weak Areas" button

  Scenario: Recommended next steps for failed exam
    Given I am on a failed exam results page
    When I scroll to "Next Steps" section
    Then I should see recommendations:
      """
      We recommend:
      1. Review your error patterns (Feature C1)
      2. Study your weak categories (Feature C2)
      3. Practice with targeted questions
      4. Retake the exam when ready
      """
    And each recommendation should have a clickable link
Feature 3.2: Error Pattern Analysis (C1)
Backend Contract:

Endpoint: GET /api/users/me/analytics/error-patterns?simulationId={id}

Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "simulationId": 43,
  "totalErrors": 12,
  "patterns": [
    {
      "pattern": "SIGN_CONFUSION",
      "count": 5,
      "percentage": 41.7,
      "severity": "HIGH",
      "description": "Confusing similar-looking traffic signs",
      "affectedCategories": ["DANGER_SIGNS", "PROHIBITION_SIGNS"],
      "recommendation": "Focus on distinguishing sign shapes and colors. Study signs side-by-side.",
      "exampleQuestions": 
    },
    {
      "pattern": "PRIORITY_MISUNDERSTANDING",
      "count": 4,
      "percentage": 33.3,
      "severity": "HIGH",
      "description": "Misunderstanding right-of-way rules",
      "affectedCategories": ["PRIORITY_RULES"],
      "recommendation": "Review priority rules at intersections and roundabouts.",
      "exampleQuestions": 
    }
  ]
}
BDD Scenario 3.2.1: View Error Patterns

text
Feature: C1 - Error Pattern Analysis
  As a user who made mistakes in the exam
  I want to understand why I made those mistakes
  So that I can improve strategically

  Background:
    Given I completed exam with simulationId 43
    And I made 12 errors
    And I am on "/exam/results/43"

  Scenario: Navigate to error analysis
    Given I see a "View Error Analysis" button
    When I click the button
    Then I should be navigated to "/analytics/error-patterns?examId=43"
    And the system should fetch data from "/api/users/me/analytics/error-patterns?simulationId=43"

  Scenario: Display error pattern summary
    Given I am on "/analytics/error-patterns?examId=43"
    When the data loads
    Then I should see a header:
      """
      Error Pattern Analysis
      
      We analyzed your 12 incorrect answers and identified these patterns:
      """
    And I should see 6 pattern cards (or fewer if not all patterns present):
      | Pattern                       | Count | % of Errors | Severity |
      | SIGN_CONFUSION                | 5     | 41.7%       | High     |
      | PRIORITY_MISUNDERSTANDING     | 4     | 33.3%       | High     |
      | SPEED_REGULATION_ERROR        | 2     | 16.7%       | Medium   |
      | PROHIBITION_MISINTERPRETATION | 1     | 8.3%        | Low      |
    And each card should have a distinct color based on severity:
      | Severity | Color  |
      | High     | Red    |
      | Medium   | Orange |
      | Low      | Yellow |

  Scenario: Display pattern in chart form
    Given I am on the error patterns page
    Then I should see a bar chart or pie chart showing:
      - X-axis: Pattern name
      - Y-axis: Count
      - Colors: Based on severity
    And the chart should be interactive (hover to see details)
BDD Scenario 3.2.2: Error Pattern Details

text
Feature: Error Pattern Drill-Down
  As a user viewing error patterns
  I want detailed information about each pattern
  So that I understand exactly what to improve

  Scenario: Expand pattern card
    Given I am on the error patterns page
    And I see the "SIGN_CONFUSION" card with 5 errors
    When I click on the card
    Then the card should expand
    And I should see:
      | Field               | Content                                       |
      | Definition          | "Confusing similar-looking traffic signs"     |
      | Why It Matters      | "These signs have critical safety differences"|
      | Affected Categories | "Danger Signs, Prohibition Signs"             |
      | Your Errors         | "5 questions" (with question IDs)             |
      | Recommendation      | "Focus on distinguishing sign shapes..."      |
    And I should see a "Practice This Pattern" button

  Scenario: View example questions
    Given I have expanded the "SIGN_CONFUSION" card
    When I click "View Example Questions"
    Then I should see a modal with the actual questions I got wrong
    And each question should show:
      | Element          | Content                      |
      | Question Text    | Original question            |
      | Your Answer      | Option I selected (marked ❌)|
      | Correct Answer   | Correct option (marked ✅)   |
      | Explanation      | Why correct answer is right  |
    And I should be able to navigate between questions with arrows

  Scenario: Start targeted practice
    Given I am viewing the "SIGN_CONFUSION" pattern
    When I click "Practice This Pattern"
    Then I should be navigated to "/practice?pattern=SIGN_CONFUSION"
    And the system should generate a practice session with:
      - Questions matching this pattern
      - From affected categories
      - Similar difficulty to what I got wrong
Feature 3.3: Weak Areas Recommendations (C2)
Backend Contract:

Endpoint: GET /api/users/me/analytics/weak-areas

Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "weakAreas": [
    {
      "categoryCode": "PRIORITY_RULES",
      "categoryName": "Priority Rules",
      "currentAccuracy": 62.5,
      "attemptsCount": 32,
      "correctCount": 20,
      "totalCount": 32,
      "recommendedQuestions": 15,
      "suggestedDifficulty": "MEDIUM",
      "estimatedTimeMinutes": 20,
      "priority": "HIGH",
      "improvementPotential": 18.0
    },
    {
      "categoryCode": "PARKING_RULES",
      "categoryName": "Parking Rules",
      "currentAccuracy": 71.4,
      "attemptsCount": 28,
      "correctCount": 20,
      "totalCount": 28,
      "recommendedQuestions": 8,
      "suggestedDifficulty": "HARD",
      "estimatedTimeMinutes": 12,
      "priority": "MEDIUM",
      "improvementPotential": 11.0
    }
  ],
  "strongAreas": [
    {
      "categoryCode": "DANGER_SIGNS",
      "categoryName": "Danger Signs",
      "currentAccuracy": 88.9,
      "attemptsCount": 45,
      "correctCount": 40,
      "totalCount": 45
    }
  ]
}
BDD Scenario 3.3.1: View Weak Areas Dashboard

text
Feature: C2 - Weak Areas Recommendations
  As a user with exam history
  I want personalized study recommendations
  So that I can improve efficiently

  Background:
    Given I have completed at least 3 exams
    And I am logged in

  Scenario: Navigate to weak areas
    Given I am on "/dashboard"
    When I click "Study Recommendations" or "Weak Areas"
    Then I should be navigated to "/analytics/weak-areas"
    And the system should fetch data from "/api/users/me/analytics/weak-areas"

  Scenario: Display weak areas table
    Given I am on "/analytics/weak-areas"
    When the data loads
    Then I should see a header:
      """
      Personalized Study Recommendations
      
      Based on your exam history, we recommend focusing on these areas:
      """
    And I should see a table:
      | Category       | Accuracy | Priority | Recommended Questions | Difficulty | Est. Time |
      | Priority Rules | 62.5%    | High     | 15                    | Medium     | 20 min    |
      | Parking Rules  | 71.4%    | Medium   | 8                     | Hard       | 12 min    |
    And each row should have a "Start Practice" button

  Scenario: Priority indicators
    Given I am viewing weak areas
    Then categories should be sorted by priority (HIGH → MEDIUM → LOW)
    And each priority should have a visual indicator:
      | Priority | Icon | Color  |
      | High     | 🔴   | Red    |
      | Medium   | 🟡   | Orange |
      | Low      | 🟢   | Green  |
BDD Scenario 3.3.2: Start Targeted Practice

text
Feature: Targeted Practice Session
  As a user viewing weak areas
  I want to start a practice session immediately
  So that I can improve my weak categories

  Scenario: Start practice from weak areas
    Given I am on "/analytics/weak-areas"
    And I see "Priority Rules" with recommendation "15 questions, MEDIUM difficulty"
    When I click "Start Practice" for Priority Rules
    Then I should be navigated to "/practice/priority-rules"
    And the system should send POST request to "/api/users/me/practice-sessions"
    And the request should specify:
      ```json
      {
        "categoryCode": "PRIORITY_RULES",
        "questionCount": 15,
        "difficulty": "MEDIUM"
      }
      ```
    And I should enter a practice mode with:
      - 15 questions from Priority Rules
      - Medium difficulty
      - No time limit
      - Immediate answer feedback (unlike exam)

  Scenario: Track practice progress
    Given I completed a practice session for Priority Rules
    When I return to "/analytics/weak-areas"
    Then the accuracy for Priority Rules should update
    And I should see "Last practiced: 5 minutes ago"
    And the recommended question count should adjust
BDD Scenario 3.3.3: Strong Areas Display

text
Feature: Strong Areas Recognition
  As a user
  I want to see my strong areas too
  So that I know what I've mastered

  Scenario: Display strong areas
    Given I am on "/analytics/weak-areas"
    When I scroll to "Your Strong Areas" section
    Then I should see categories with accuracy > 80%:
      | Category      | Accuracy | Attempts | Status       |
      | Danger Signs  | 88.9%    | 45       | Excellent ✅ |
      | Speed Limits  | 85.7%    | 42       | Strong ✅    |
    And I should see a message "Great job! Keep maintaining these areas."
4. Progress Tracking
Feature 4.1: Overall Progress Dashboard
Backend Contract:

Endpoint: GET /api/users/me/progress/overall

Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "totalExamsTaken": 12,
  "averageScore": 78.5,
  "passRate": 66.7,
  "totalStudyTimeMinutes": 504,
  "currentStreak": 5,
  "longestStreak": 8,
  "lastExamDate": "2024-01-22T14:30:00Z",
  "firstExamDate": "2024-01-10T10:00:00Z",
  "examHistory": [
    {
      "simulationId": 1,
      "date": "2024-01-10",
      "score": 38,
      "percentage": 76.0,
      "passed": false
    },
    {
      "simulationId": 2,
      "date": "2024-01-11",
      "score": 40,
      "percentage": 80.0,
      "passed": false
    },
    {
      "simulationId": 12,
      "date": "2024-01-22",
      "score": 43,
      "percentage": 86.0,
      "passed": true
    }
  ]
}
BDD Scenario 4.1.1: Display Overall Progress

text
Feature: User Progress Overview
  As a ReadyRoad user
  I want to see my overall progress
  So that I can track my improvement

  Background:
    Given I am logged in
    And I have completed 12 exams

  Scenario: View progress dashboard
    When I navigate to "/dashboard"
    Then the system should fetch data from "/api/users/me/progress/overall"
    And I should see a "Progress Overview" section with metric cards:
      | Metric              | Value       | Icon |
      | Total Exams Taken   | 12          | 📝   |
      | Average Score       | 78.5%       | 📊   |
      | Pass Rate           | 66.7%       | ✅   |
      | Total Study Time    | 8h 24min    | ⏱️   |
      | Current Streak      | 5 days      | 🔥   |
    And each card should be visually distinct
    And cards should be responsive (2 columns on mobile, 4 on desktop)

  Scenario: Display score trend chart
    Given I am on "/dashboard"
    When I scroll to "Score Trend" section
    Then I should see a line chart showing:
      - X-axis: Exam date (chronological)
      - Y-axis: Score percentage (0-100%)
      - Passing line: Horizontal line at 82%
      - Data points: One per exam (12 points total)
      - Trend line: Best-fit line showing improvement
    And failed exams should be marked with red dots
    And passed exams should be marked with green dots
    And I should be able to hover over points to see details

  Scenario: Progress indicators
    Given I am viewing my dashboard
    Then I should see improvement indicators:
      | Metric         | Current | Previous | Indicator |
      | Average Score  | 78.5%   | 75.2%    | ↑ +3.3%   |
      | Pass Rate      | 66.7%   | 60.0%    | ↑ +6.7%   |
    And positive changes should be shown in green
    And negative changes should be shown in red
BDD Scenario 4.1.2: Exam History Table

text
Feature: Detailed Exam History
  As a user
  I want to see my complete exam history
  So that I can review past performances

  Scenario: View exam history table
    Given I am on "/progress" or "/dashboard"
    When I scroll to "Exam History" section
    Then I should see a table with all my exams:
      | Date       | Score | Percentage | Status  | Time Taken | Actions |
      | 2024-01-22 | 43/50 | 86%        | Passed  | 38:24      | [View]  |
      | 2024-01-21 | 40/50 | 80%        | Failed  | 42:10      | [View]  |
      | 2024-01-20 | 38/50 | 76%        | Failed  | 44:55      | [View]  |
    And the table should be sorted by date (newest first)
    And I should be able to click [View] to see results

  Scenario: Filter exam history
    Given I am viewing exam history
    When I select filter "Passed Only"
    Then only passed exams should be displayed
    When I select filter "Failed Only"
    Then only failed exams should be displayed
Feature 4.2: Category-Level Progress
Backend Contract:

Endpoint: GET /api/users/me/progress/categories

Headers: Authorization: Bearer <token>

Success Response (200):

json
{
  "categories": [
    {
      "categoryCode": "DANGER_SIGNS",
      "categoryName": "Danger Signs",
      "totalAttempts": 45,
      "correctAnswers": 40,
      "totalQuestions": 45,
      "accuracy": 88.9,
      "status": "STRONG",
      "lastPracticed": "2024-01-22T14:30:00Z",
      "improvementRate": 12.5
    },
    {
      "categoryCode": "PRIORITY_RULES",
      "categoryName": "Priority Rules",
      "totalAttempts": 32,
      "correctAnswers": 20,
      "totalQuestions": 32,
      "accuracy": 62.5,
      "status": "WEAK",
      "lastPracticed": "2024-01-20T10:15:00Z",
      "improvementRate": -5.2
    }
  ]
}
BDD Scenario 4.2.1: View Category Progress

text
Feature: Progress by Category
  As a user
  I want to see my progress per category
  So that I know which areas I'm strong/weak in

  Background:
    Given I am logged in
    And I have answered questions across multiple categories

  Scenario: Navigate to category progress
    Given I am on "/dashboard"
    When I click "Category Performance" or "Detailed Progress"
    Then I should be navigated to "/progress/categories"
    And the system should fetch data from "/api/users/me/progress/categories"

  Scenario: Display category progress table
    Given I am on "/progress/categories"
    When the data loads
    Then I should see a table:
      | Category        | Attempts | Correct | Accuracy | Status       | Last Practiced | Trend |
      | Danger Signs    | 45       | 40      | 88.9%    | Strong ✅    | 2 hours ago    | ↑     |
      | Priority Rules  | 32       | 20      | 62.5%    | Weak ⚠️      | 2 days ago     | ↓     |
      | Speed Limits    | 28       | 24      | 85.7%    | Strong ✅    | 1 day ago      | ↑     |
      | Parking Rules   | 24       | 17      | 70.8%    | Average 🟡   | 3 days ago     | →     |
    And categories should be sortable by any column
    And I should be able to filter by status (Strong/Average/Weak)

  Scenario: Status indicators
    Given I am viewing category progress
    Then status should be determined by accuracy:
      | Accuracy   | Status    | Icon | Color  |
      | >= 85%     | Strong    | ✅   | Green  |
      | 75% - 84%  | Average   | 🟡   | Yellow |
      | < 75%      | Weak      | ⚠️   | Orange |
      | < 60%      | Critical  | ❌   | Red    |

  Scenario: Category drill-down
    Given I am viewing category progress
    When I click on "Priority Rules"
    Then I should be navigated to "/progress/categories/priority-rules"
    And I should see:
      - Detailed question-by-question history for this category
      - Sub-topics within the category (if applicable)
      - Recommended practice plan
      - "Start Practice" button
BDD Scenario 4.2.2: Category Comparison Chart

text
Feature: Visual Category Comparison
  As a user
  I want to visualize my category performance
  So that I can quickly identify strengths and weaknesses

  Scenario: Display radar chart
    Given I am on "/progress/categories"
    When the page loads
    Then I should see a radar/spider chart with:
      - One axis per category (8-10 axes)
      - Each axis scaled 0-100%
      - My accuracy plotted on each axis
      - Shaded area showing my coverage
      - Reference line at 80% (target)
    And hovering over a point should show category name and accuracy

  Scenario: Display bar chart comparison
    Given I am on "/progress/categories"
    When I scroll to "Category Comparison" section
    Then I should see a horizontal bar chart:
      - Y-axis: Category names
      - X-axis: Accuracy percentage (0-100%)
      - Bars colored by status (green/yellow/orange/red)
      - Reference line at 80%
    And bars should be sorted by accuracy (descending)
5. Public Content (SEO)
Feature 5.1: Traffic Signs Library (Static)
Backend Contract:

Endpoint: GET /api/traffic-signs (public, no auth)

Success Response (200):

json
{
  "signs": [
    {
      "id": 1,
      "signCode": "A1a",
      "categoryCode": "DANGER_SIGNS",
      "nameEn": "Sharp Right Turn",
      "nameAr": "منعطف حاد لليمين",
      "nameNl": "Scherpe bocht naar rechts",
      "nameFr": "Virage serré à droite",
      "imageUrl": "/images/signs/a1a.png"
    }
  ]
}
BDD Scenario 5.1.1: Traffic Signs Index Page

text
Feature: Public Traffic Signs Library
  As a visitor (not logged in)
  I want to browse Belgian traffic signs
  So that I can learn before registering

  Scenario: View all traffic signs
    Given I am not logged in
    When I navigate to "/traffic-signs"
    Then the page should be statically generated (SSG)
    And the page should fetch signs from "/api/traffic-signs" at build time
    And I should see a grid of traffic signs (4 columns on desktop, 2 on tablet, 1 on mobile)
    And each sign card should display:
      | Element    | Content         |
      | Image      | Sign icon       |
      | Code       | e.g., "A1a"     |
      | Name       | In selected language |
    And I should see a category filter dropdown
    And I should see a search bar

  Scenario: Filter signs by category
    Given I am on "/traffic-signs"
    When I select "Danger Signs" from the category filter
    Then only signs with categoryCode "DANGER_SIGNS" should be displayed
    And the URL should update to "/traffic-signs?category=danger-signs"

  Scenario: Search for a sign
    Given I am on "/traffic-signs"
    When I type "right turn" in the search bar
    Then signs should be filtered to match:
      - nameEn contains "right turn"
      - signCode contains "right turn"
    And results should update in real-time (debounced)

  Scenario: SEO for signs index
    Given I am on "/traffic-signs"
    Then the page should have:
      | Meta Tag      | Content                                    |
      | title         | Belgian Traffic Signs - ReadyRoad          |
      | description   | Complete guide to Belgian traffic signs... |
      | og:title      | Belgian Traffic Signs                      |
      | og:image      | /images/og-traffic-signs.png               |
    And the page should have <h1>Belgian Traffic Signs</h1>
    And the page should have structured data (JSON-LD) for ItemList
BDD Scenario 5.1.2: Individual Sign Page (SSG)

text
Feature: Individual Traffic Sign Page
  As a visitor
  I want to view detailed information about a specific sign
  So that I can understand its meaning

  Scenario: Generate static paths for all signs
    Given there are 200+ traffic signs in the database
    When Next.js builds the application
    Then generateStaticParams should return paths for all signs:
      ```typescript
      [
        { signCode: 'a1a' },
        { signCode: 'a1b' },
        ...
      ]
      ```
    And pages should be pre-rendered at build time

  Scenario: View sign details
    Given I am on "/traffic-signs/a1a"
    Then the page should be statically generated
    And I should see:
      | Element           | Content                          |
      | Sign Image        | Large image (400x400px)          |
      | Sign Code         | "A1a"                            |
      | Sign Name         | Multi-language tabs (EN/AR/NL/FR)|
      | Category          | "Danger Signs" (with link)       |
      | Description       | Full explanation in selected lang|
      | Usage Context     | Where/when this sign is used     |
      | Related Signs     | Similar signs (3-5 cards)        |
    And I should see a "Test Your Knowledge" button

  Scenario: SEO for individual sign
    Given I am on "/traffic-signs/a1a"
    Then the page should have:
      | Meta Tag      | Content                                    |
      | title         | A1a - Sharp Right Turn Sign - ReadyRoad    |
      | description   | Learn about the A1a danger sign meaning... |
      | og:title      | A1a: Sharp Right Turn Sign                 |
      | og:image      | /images/signs/a1a.png                      |
    And the page should have <h1>A1a: Sharp Right Turn</h1>
    And structured data (JSON-LD) for Article

  Scenario: Navigate to related signs
    Given I am on "/traffic-signs/a1a"
    When I scroll to "Related Signs" section
    Then I should see 3-5 similar signs
    When I click on sign "A1b"
    Then I should navigate to "/traffic-signs/a1b"
    And the page should load instantly (already pre-rendered)
Feature 5.2: Lessons Library (Static)
Backend Contract:

Endpoint: GET /api/lessons (public, no auth)

Success Response (200):

json
{
  "lessons": [
    {
      "id": 1,
      "lessonCode": "priority-rules",
      "titleEn": "Priority Rules at Intersections",
      "titleAr": "قواعد الأولوية عند التقاطعات",
      "contentEn": "Full lesson content...",
      "contentAr": "محتوى الدرس الكامل...",
      "pdfUrl": "/pdfs/priority-rules.pdf",
      "orderIndex": 20
    }
  ]
}
BDD Scenario 5.2.1: Lessons Index Page

text
Feature: Public Lessons Library
  As a visitor
  I want to browse driving theory lessons
  So that I can study before taking exams

  Scenario: View all lessons
    Given I am on "/lessons"
    Then the page should be statically generated
    And I should see a grid of 31 lesson cards
    And each card should display:
      | Element       | Content                  |
      | Lesson Number | e.g., "Lesson 20"        |
      | Title         | In selected language     |
      | Description   | Brief summary (2 lines)  |
      | Duration      | Estimated read time      |
      | Difficulty    | Beginner/Intermediate    |
    And lessons should be grouped by topic:
      - Road Rules (Lessons 1-10)
      - Traffic Signs (Lessons 11-15)
      - Priority & Safety (Lessons 16-25)
      - Practical Driving (Lessons 26-31)

  Scenario: SEO for lessons index
    Then the page should have:
      | Meta Tag    | Content                                |
      | title       | Driving Theory Lessons - ReadyRoad     |
      | description | Master Belgian driving theory with...  |
    And structured data for ItemList
BDD Scenario 5.2.2: Individual Lesson Page

text
Feature: Individual Lesson Page
  As a visitor
  I want to read a complete lesson
  So that I can learn driving theory

  Scenario: View lesson content
    Given I am on "/lessons/priority-rules"
    Then the page should be statically generated
    And I should see:
      | Element         | Content                       |
      | Lesson Title    | Multi-language                |
      | Content         | Full text with headings       |
      | Images/Diagrams | Embedded visuals              |
      | PDF Download    | "Download PDF" button         |
      | Previous/Next   | Navigation to adjacent lessons|
      | Related Topics  | Links to related lessons      |

  Scenario: Download PDF
    Given I am on a lesson page
    When I click "Download PDF"
    Then the PDF should open in a new tab
    Or download to my device
    And the PDF should contain the same content as the web page

  Scenario: SEO for individual lesson
    Given I am on "/lessons/priority-rules"
    Then the page should have:
      | Meta Tag    | Content                                    |
      | title       | Priority Rules at Intersections - ReadyRoad|
      | description | Learn how to navigate Belgian intersections|
    And structured data for Article or EducationalOccupationalCredential
6. Multi-Language Support
Feature 6.1: Language Switching
BDD Scenario 6.1.1: Language Selection

text
Feature: Multi-Language Interface
  As a ReadyRoad user
  I want to switch between languages
  So that I can use the app in my preferred language

  Scenario: Display language selector
    Given I am on any page
    Then I should see a language selector in the navbar
    And the selector should display the current language (e.g., "🇬🇧 English")

  Scenario: Switch language
    Given I am on any page
    And the current language is "English"
    When I click the language selector
    Then I should see a dropdown with options:
      | Language   | Flag | Code |
      | العربية    | 🇦🇪  | AR   |
      | English    | 🇬🇧  | EN   |
      | Nederlands | 🇳🇱  | NL   |
      | Français   | 🇫🇷  | FR   |
    When I select "العربية"
    Then the UI should switch to Arabic
    And the text direction should change to RTL
    And my preference should be saved in localStorage with key "language"
    And the page should re-render with Arabic content

  Scenario: RTL layout for Arabic
    Given I have selected Arabic language
    When I view any page
    Then the layout should be RTL:
      - Navbar: Logo on right, menu on left
      - Text alignment: Right-aligned
      - Icons: Mirrored where appropriate
      - Forms: Labels on right, inputs on left
    And CSS should use logical properties (start/end instead of left/right)

  Scenario: Persist language preference
    Given I have selected "Nederlands"
    When I refresh the page
    Then the language should still be "Nederlands"
    And the preference should be read from localStorage
BDD Scenario 6.1.2: Language-Specific Content

text
Feature: Multi-Language Content Fetching
  As the system
  I want to fetch content in the user's selected language
  So that everything is translated

  Scenario: Fetch questions in selected language
    Given I am taking an exam
    And my selected language is "FR"
    When a question is displayed
    Then the question text should be from "questionTextFr" field
    And options should be from "textFr" fields
    And if French translation is missing
    Then fallback to English ("questionTextEn")

  Scenario: Static content translation
    Given I am on "/traffic-signs"
    And my selected language is "NL"
    Then all UI text should be in Dutch:
      - Page title: "Verkeersborden"
      - Buttons: "Filter", "Zoeken"
      - Labels: "Categorie", "Code"
    And sign names should display "nameNl" field
7. Technical Requirements
Feature 7.1: Next.js App Router Configuration
BDD Scenario 7.1.1: Project Structure

text
Feature: Next.js 14 App Router Structure
  As a developer
  I want a well-organized project structure
  So that the codebase is maintainable

  Scenario: Verify folder structure
    Given the Next.js project is initialized
    Then the structure should be:
      ```
      src/
      ├── app/
      │   ├── (auth)/
      │   │   ├── login/
      │   │   │   └── page.tsx
      │   │   └── register/
      │   │       └── page.tsx
      │   ├── (protected)/
      │   │   ├── layout.tsx          # Auth required
      │   │   ├── dashboard/
      │   │   │   └── page.tsx
      │   │   ├── exam/
      │   │   │   ├── page.tsx
      │   │   │   ├── [id]/
      │   │   │   │   └── page.tsx
      │   │   │   └── results/
      │   │   │       └── [id]/
      │   │   │           └── page.tsx
      │   │   ├── analytics/
      │   │   │   ├── error-patterns/
      │   │   │   │   └── page.tsx
      │   │   │   └── weak-areas/
      │   │   │       └── page.tsx
      │   │   └── progress/
      │   │       ├── page.tsx
      │   │       └── categories/
      │   │           └── page.tsx
      │   ├── traffic-signs/
      │   │   ├── page.tsx
      │   │   └── [signCode]/
      │   │       └── page.tsx
      │   ├── lessons/
      │   │   ├── page.tsx
      │   │   └── [lessonCode]/
      │   │       └── page.tsx
      │   ├── layout.tsx              # Root layout
      │   ├── page.tsx                # Homepage
      │   └── not-found.tsx
      ├── components/
      │   ├── ui/                     # Reusable UI components
      │   ├── exam/                   # Exam-specific components
      │   └── layout/                 # Layout components
      ├── lib/
      │   ├── api.ts                  # Axios client
      │   ├── types.ts                # TypeScript types
      │   ├── utils.ts                # Helper functions
      │   └── constants.ts            # App constants
      ├── contexts/
      │   ├── AuthContext.tsx
      │   └── LanguageContext.tsx
      └── middleware.ts               # Route protection
      ```
BDD Scenario 7.1.2: Environment Variables

text
Feature: Environment Configuration
  As a developer
  I want environment variables properly configured
  So that the app works in different environments

  Scenario: Define environment variables
    Given the project root
    Then there should be a file ".env.local" with:
      ```
      NEXT_PUBLIC_API_URL=http://localhost:8890/api
      NEXT_PUBLIC_APP_URL=http://localhost:3000
      JWT_SECRET=your-secret-key-here
      ```
    And there should be a file ".env.production" with:
      ```
      NEXT_PUBLIC_API_URL=https://api.readyroad.be/api
      NEXT_PUBLIC_APP_URL=https://readyroad.be
      JWT_SECRET=production-secret-key
      ```

  Scenario: Access environment variables
    Given I am in a client component
    When I need the API URL
    Then I should access it via "process.env.NEXT_PUBLIC_API_URL"
    And it should be type-safe via TypeScript
BDD Scenario 7.1.3: Middleware for Route Protection

text
Feature: Authentication Middleware
  As the system
  I want to protect routes with middleware
  So that unauthorized users cannot access protected pages

  Scenario: Middleware checks for auth token
    Given there is a file "src/middleware.ts"
    Then it should export a middleware function
    And the function should:
      ```typescript
      export function middleware(request: NextRequest) {
        const token = request.cookies.get('auth_token')
        const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
                               || request.nextUrl.pathname.startsWith('/exam')
                               || request.nextUrl.pathname.startsWith('/analytics')
                               || request.nextUrl.pathname.startsWith('/progress')
        
        if (isProtectedRoute && !token) {
          return NextResponse.redirect(new URL('/login', request.url))
        }
        
        return NextResponse.next()
      }
      
      export const config = {
        matcher: ['/dashboard/:path*', '/exam/:path*', '/analytics/:path*', '/progress/:path*']
      }
      ```

  Scenario: Public routes are accessible
    Given I am not logged in
    When I navigate to "/traffic-signs"
    Then the middleware should not redirect me
    And I should access the page successfully

  Scenario: Protected routes require auth
    Given I am not logged in
    When I try to navigate to "/dashboard"
    Then the middleware should redirect me to "/login"
Feature 7.2: TypeScript Types
BDD Scenario 7.2.1: Define Core Types

text
Feature: TypeScript Type Definitions
  As a developer
  I want strong typing for all data structures
  So that I catch errors at compile time

  Scenario: Define types in lib/types.ts
    Given there is a file "src/lib/types.ts"
    Then it should contain type definitions:
      ```typescript
      // User types
      export interface User {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        role: 'STUDENT' | 'ADMIN';
        createdAt: string;
      }

      // Auth types
      export interface LoginRequest {
        username: string;
        password: string;
      }

      export interface LoginResponse {
        token: string;
        type: 'Bearer';
        expiresIn: number;
      }

      // Traffic Sign types
      export interface TrafficSign {
        id: number;
        signCode: string;
        categoryCode: string;
        nameEn: string;
        nameAr: string;
        nameNl: string;
        nameFr: string;
        descriptionEn: string;
        descriptionAr: string;
        descriptionNl: string;
        descriptionFr: string;
        imageUrl: string;
      }

      // Question types
      export interface ExamQuestion {
        id: number;
        questionTextEn: string;
        questionTextAr: string;
        questionTextNl: string;
        questionTextFr: string;
        imageUrl?: string;
        categoryCode: string;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        options: QuestionOption[];
      }

      export interface QuestionOption {
        number: 1 | 2 | 3;
        textEn: string;
        textAr: string;
        textNl: string;
        textFr: string;
      }

      // Exam types
      export interface ExamSimulation {
        simulationId: number;
        totalQuestions: number;
        timeLimitMinutes: number;
        passingScore: number;
        startedAt: string;
        expiresAt: string;
        questions: ExamQuestion[];
      }

      export interface ExamAnswer {
        questionId: number;
        selectedOption: 1 | 2 | 3;
      }

      export interface ExamResult {
        simulationId: number;
        score: number;
        totalQuestions: number;
        percentage: number;
        passed: boolean;
        passingScore: number;
        completedAt: string;
        timeTaken: string;
        categoryBreakdown: CategoryBreakdown[];
      }

      // Analytics types (Feature C)
      export interface ErrorPattern {
        pattern: 'SIGN_CONFUSION' | 'PRIORITY_MISUNDERSTANDING' | 'SPEED_REGULATION_ERROR' | 
                 'PROHIBITION_MISINTERPRETATION' | 'MANDATORY_CONFUSION' | 'INFORMATION_OVERSIGHT';
        count: number;
        percentage: number;
        severity: 'HIGH' | 'MEDIUM' | 'LOW';
        description: string;
        affectedCategories: string[];
        recommendation: string;
        exampleQuestions: number[];
      }

      export interface WeakArea {
        categoryCode: string;
        categoryName: string;
        currentAccuracy: number;
        attemptsCount: number;
        correctCount: number;
        totalCount: number;
        recommendedQuestions: number;
        suggestedDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
        estimatedTimeMinutes: number;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        improvementPotential: number;
      }

      // Progress types
      export interface OverallProgress {
        totalExamsTaken: number;
        averageScore: number;
        passRate: number;
        totalStudyTimeMinutes: number;
        currentStreak: number;
        longestStreak: number;
        lastExamDate: string;
        firstExamDate: string;
        examHistory: ExamHistoryItem[];
      }

      export interface CategoryProgress {
        categoryCode: string;
        categoryName: string;
        totalAttempts: number;
        correctAnswers: number;
        totalQuestions: number;
        accuracy: number;
        status: 'STRONG' | 'AVERAGE' | 'WEAK' | 'CRITICAL';
        lastPracticed: string;
        improvementRate: number;
      }
      ```
Feature 7.3: SEO & Meta Tags
BDD Scenario 7.3.1: Dynamic Metadata

text
Feature: SEO Optimization with Metadata
  As a developer
  I want each page to have proper meta tags
  So that the site ranks well in search engines

  Scenario: Define metadata in layout
    Given there is a file "src/app/layout.tsx"
    Then it should export metadata:
      ```typescript
      export const metadata: Metadata = {
        title: {
          default: 'ReadyRoad - Belgian Driving License Exam Prep',
          template: '%s | ReadyRoad'
        },
        description: 'Master the Belgian driving license exam with ReadyRoad. 50 practice exams, 200+ traffic signs, intelligent analytics.',
        keywords: ['Belgian driving license', 'driving exam', 'traffic signs', 'theory exam'],
        openGraph: {
          title: 'ReadyRoad - Belgian Driving License Platform',
          description: 'Comprehensive exam preparation platform',
          url: 'https://readyroad.be',
          siteName: 'ReadyRoad',
          locale: 'en_BE',
          type: 'website',
          images: [
            {
              url: 'https://readyroad.be/images/og-image.png',
              width: 1200,
              height: 630,
              alt: 'ReadyRoad Platform'
            }
          ]
        },
        twitter: {
          card: 'summary_large_image',
          title: 'ReadyRoad',
          description: 'Belgian driving license exam preparation',
          images: ['https://readyroad.be/images/og-image.png']
        },
        robots: {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true
          }
        }
      };
      ```

  Scenario: Dynamic metadata for traffic sign pages
    Given there is a file "src/app/traffic-signs/[signCode]/page.tsx"
    Then it should export generateMetadata function:
      ```typescript
      export async function generateMetadata({ params }: Props): Promise<Metadata> {
        const sign = await getTrafficSign(params.signCode);
        
        return {
          title: `${sign.signCode} - ${sign.nameEn}`,
          description: sign.descriptionEn.substring(0, 160),
          openGraph: {
            title: `${sign.signCode}: ${sign.nameEn}`,
            description: sign.descriptionEn,
            images: [sign.imageUrl],
            type: 'article'
          }
        };
      }
      ```
BDD Scenario 7.3.2: Structured Data (JSON-LD)

text
Feature: Structured Data for SEO
  As the system
  I want to include structured data
  So that search engines understand the content

  Scenario: Add JSON-LD to traffic sign page
    Given I am on "/traffic-signs/a1a"
    Then the page should include a script tag with JSON-LD:
      ```json
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "A1a - Sharp Right Turn Traffic Sign",
        "description": "Learn about the Belgian A1a danger sign...",
        "image": "https://readyroad.be/images/signs/a1a.png",
        "author": {
          "@type": "Organization",
          "name": "ReadyRoad"
        },
        "publisher": {
          "@type": "Organization",
          "name": "ReadyRoad",
          "logo": {
            "@type": "ImageObject",
            "url": "https://readyroad.be/logo.png"
          }
        },
        "datePublished": "2024-01-01",
        "dateModified": "2024-01-23"
      }
      ```

  Scenario: Add JSON-LD for website
    Given I am on the homepage "/"
    Then the page should include JSON-LD for WebSite:
      ```json
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "ReadyRoad",
        "description": "Belgian driving license exam preparation platform",
        "url": "https://readyroad.be",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://readyroad.be/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
      ```
Feature 7.4: Performance Optimization
BDD Scenario 7.4.1: Image Optimization

text
Feature: Next.js Image Optimization
  As a developer
  I want images to load quickly
  So that the user experience is smooth

  Scenario: Use Next.js Image component
    Given I need to display a traffic sign image
    When I render the component
    Then I should use the Next.js Image component:
      ```tsx
      import Image from 'next/image';
      
      <Image
        src={sign.imageUrl}
        alt={sign.nameEn}
        width={400}
        height={400}
        priority={false}
        loading="lazy"
        placeholder="blur"
      />
      ```
    And the image should be automatically optimized
    And WebP format should be served to supported browsers

  Scenario: Lazy load images below the fold
    Given there are 50 traffic signs on a page
    And only 8 are visible initially
    When the page loads
    Then only the first 8 images should be loaded immediately
    And remaining images should load as user scrolls
    And this should be handled by loading="lazy"
BDD Scenario 7.4.2: Code Splitting

text
Feature: Automatic Code Splitting
  As Next.js
  I want to split code by route
  So that initial bundle size is small

  Scenario: Verify route-based splitting
    Given the app is built for production
    When I inspect the build output
    Then there should be separate chunks for:
      - /login
      - /dashboard
      - /exam/[id]
      - /traffic-signs
      - /analytics/*
    And each chunk should only include code for that route
    And shared code should be in a common chunk

  Scenario: Dynamic imports for heavy components
    Given there is a chart component that is 50KB
    When I use it on the analytics page
    Then it should be dynamically imported:
      ```tsx
      const ChartComponent = dynamic(() => import('@/components/Chart'), {
        loading: () => <p>Loading chart...</p>,
        ssr: false
      });
      ```
    And it should only load when the analytics page is accessed
Feature 7.5: Non-Functional Requirements (NFR)

Epic: As a system architect, I want the ReadyRoad web app to be performant, scalable, and accessible so that it is reliable for real-world usage under different conditions.

BDD Scenario 7.5.1: Page Load Performance

Feature: Non-Functional Requirements - Performance
  As a ReadyRoad user
  I want pages to load quickly
  So that I can use the platform without delays

  Scenario: Initial page load is fast
    Given I access the web application from a standard network connection
    When I navigate to "/"
    Then the initial page load time should be under 2 seconds
    And critical UI elements should render without blocking

BDD Scenario 7.5.2: Exam Navigation Responsiveness

Feature: Non-Functional Requirements - Performance
  As a ReadyRoad exam candidate
  I want the exam interface to remain responsive
  So that I can answer 50 questions smoothly

  Scenario: Exam navigation stays responsive for 50 questions
    Given I have started an exam with 50 questions
    When I navigate between questions
    Then each navigation action should respond within 200 milliseconds
    And no noticeable UI freezing should occur

BDD Scenario 7.5.3: API Responsiveness Under Normal Load

Feature: Non-Functional Requirements - Performance
  As a ReadyRoad user
  I want API calls to be fast
  So that the app feels reliable

  Scenario: Standard API operations respond quickly
    Given the frontend sends requests to the backend API
    When the system performs standard operations (start exam, submit answer, fetch progress)
    Then the API should respond within an acceptable time threshold (e.g. < 500 ms)
    And the UI should not be blocked waiting for responses

BDD Scenario 7.5.4: Scalability With Increased Users

Feature: Non-Functional Requirements - Scalability
  As a system designer
  I want the platform to scale efficiently
  So that growth in users does not change system behavior

  Scenario: System scales from 10 to 10,000 users without changing logic
    Given the system is used by a small number of users (e.g. 10)
    When active users increase to a large scale (e.g. 10,000)
    Then the exam logic must remain unchanged
    And the system should continue functioning correctly
    And user data must remain fully isolated and consistent

BDD Scenario 7.5.5: Keyboard Accessibility

Feature: Non-Functional Requirements - Accessibility
  As a user who relies on keyboard navigation
  I want to use the platform without a mouse
  So that I can complete all critical actions

  Scenario: Full keyboard navigation support
    Given I use keyboard navigation only
    When I interact with forms, buttons, and exam questions
    Then all interactive elements should be reachable via keyboard
    And the focus order should be logical and predictable

BDD Scenario 7.5.6: Screen Reader Compatibility

Feature: Non-Functional Requirements - Accessibility
  As a user who uses a screen reader
  I want the content to be readable by assistive technologies
  So that I can use the platform independently

  Scenario: Semantic structure and labels exist for key elements
    Given I navigate pages using a screen reader
    When I access key UI elements (navigation, buttons, form fields, exam questions)
    Then important elements should have appropriate labels
    And the page should use semantic HTML structure
    And critical information must not rely on visual-only cues

Summary:
Non-Functional Requirements ensure ReadyRoad is not only functionally correct,
but also a reliable, scalable, and human-centered system suitable for real-world use.


Summary
This BDD contract defines:

✅ 8 major features with detailed scenarios
✅ Authentication (JWT, protected routes, middleware)
✅ Exam Engine (Belgian rules, timer, submission)
✅ Analytics (C1 error patterns, C2 weak areas)
✅ Progress Tracking (overall, categories)
✅ Public Content (traffic signs, lessons, SEO)
✅ Multi-Language (4 languages, RTL support)
✅ Technical Requirements (Next.js 14, TypeScript, performance)

Every scenario uses Given/When/Then format, includes acceptance criteria, and specifies backend contracts where applicable.

This document serves as:

✅ Developer specification for implementation

✅ Testing checklist for QA

✅ API contract for frontend-backend integration

✅ BDD test scenarios for automated testing

End of Contract