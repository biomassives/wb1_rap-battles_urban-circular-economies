/**
 * Training Quiz Manager
 * Handles quiz flow, timing, scoring, and certificate minting
 */

class TrainingQuizManager {
  constructor() {
    this.quizId = '00000000-0000-0000-0000-000000000001'; // Default quiz ID
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.answers = {}; // { questionId: selectedChoiceId }
    this.timeLimit = 15 * 60; // 15 minutes in seconds
    this.timeRemaining = this.timeLimit;
    this.timerInterval = null;
    this.startTime = null;
    this.attemptId = null;
    this.wallet = null;
  }

  async init() {
    console.log('Initializing Training Quiz Manager');

    // Get wallet address
    this.wallet = window.walletManager?.connectedWallet;

    if (!this.wallet) {
      this.showError('Please connect your wallet to take the quiz');
      return;
    }

    // Check attempt eligibility
    await this.checkAttemptEligibility();

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Start quiz button
    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startQuiz());
    }

    // Navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousQuestion());
    }

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    // Retake quiz button
    const retakeBtn = document.getElementById('retake-quiz-btn');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => this.resetQuiz());
    }

    // Mint certificate button
    const mintBtn = document.getElementById('mint-certificate-btn');
    if (mintBtn) {
      mintBtn.addEventListener('click', () => this.mintCertificate());
    }
  }

  async checkAttemptEligibility() {
    try {
      const response = await fetch(`/api/quiz/check-eligibility?walletAddress=${this.wallet}&quizId=${this.quizId}`);
      const data = await response.json();

      if (!data.eligible) {
        this.showAttemptLimit(data.message, data.nextAttemptTime);
        document.getElementById('start-quiz-btn').disabled = true;
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      // Allow attempt if check fails
    }
  }

  showAttemptLimit(message, nextAttemptTime) {
    const status = document.getElementById('attempt-status');
    if (status) {
      status.style.display = 'block';
      status.querySelector('.status-message').innerHTML = `
        <p><strong>⏸️ ${message}</strong></p>
        ${nextAttemptTime ? `<p>Next attempt available: ${new Date(nextAttemptTime).toLocaleString()}</p>` : ''}
      `;
    }
  }

  async startQuiz() {
    console.log('Starting quiz...');

    // Load questions
    await this.loadQuestions();

    if (this.questions.length === 0) {
      this.showError('Failed to load quiz questions. Please try again.');
      return;
    }

    // Start timer
    this.startTime = Date.now();
    this.startTimer();

    // Switch to questions screen
    this.showScreen('quiz-questions');

    // Display first question
    this.displayQuestion();
  }

  async loadQuestions() {
    try {
      const response = await fetch(`/api/quiz/questions?quizId=${this.quizId}`);
      const data = await response.json();

      if (data.success) {
        this.questions = data.questions;
        console.log(`Loaded ${this.questions.length} questions`);
      } else {
        throw new Error(data.error || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Error loading questions:', error);

      // Fallback to sample questions for demo
      this.questions = this.getSampleQuestions();
    }
  }

  displayQuestion() {
    const question = this.questions[this.currentQuestionIndex];
    if (!question) return;

    // Update counter
    document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = this.questions.length;

    // Update progress bar
    const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;

    // Update category badge
    const categoryBadge = document.getElementById('question-category');
    categoryBadge.textContent = this.formatCategory(question.category);

    // Update question text
    document.getElementById('question-text').textContent = question.question_text;

    // Update difficulty
    const difficultyBadge = document.getElementById('question-difficulty');
    difficultyBadge.textContent = question.difficulty || 'medium';
    difficultyBadge.className = `difficulty-badge ${question.difficulty || 'medium'}`;

    // Render answer choices
    this.renderAnswerChoices(question);

    // Update navigation buttons
    document.getElementById('prev-btn').disabled = this.currentQuestionIndex === 0;

    const nextBtn = document.getElementById('next-btn');
    if (this.currentQuestionIndex === this.questions.length - 1) {
      nextBtn.textContent = 'Submit Quiz';
    } else {
      nextBtn.textContent = 'Next →';
    }
  }

  renderAnswerChoices(question) {
    const container = document.getElementById('answer-choices');
    container.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];

    question.choices.forEach((choice, index) => {
      const choiceDiv = document.createElement('div');
      choiceDiv.className = 'answer-choice';
      choiceDiv.dataset.choiceId = choice.id;

      // Check if this choice is already selected
      if (this.answers[question.id] === choice.id) {
        choiceDiv.classList.add('selected');
      }

      choiceDiv.innerHTML = `
        <div class="choice-letter">${letters[index]}</div>
        <div class="choice-text">${choice.choice_text}</div>
      `;

      choiceDiv.addEventListener('click', () => {
        this.selectAnswer(question.id, choice.id);
      });

      container.appendChild(choiceDiv);
    });
  }

  selectAnswer(questionId, choiceId) {
    this.answers[questionId] = choiceId;

    // Update visual selection
    document.querySelectorAll('.answer-choice').forEach(choice => {
      choice.classList.remove('selected');
    });
    document.querySelector(`[data-choice-id="${choiceId}"]`).classList.add('selected');

    console.log('Answer selected:', { questionId, choiceId });
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.displayQuestion();
    }
  }

  nextQuestion() {
    // Check if on last question
    if (this.currentQuestionIndex === this.questions.length - 1) {
      this.submitQuiz();
    } else {
      this.currentQuestionIndex++;
      this.displayQuestion();
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      document.getElementById('timer').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Change color when time is running out
      const timerElement = document.querySelector('.time-remaining');
      if (this.timeRemaining < 60) {
        timerElement.style.color = '#ef4444'; // Red
      } else if (this.timeRemaining < 300) {
        timerElement.style.color = '#f59e0b'; // Orange
      }

      // Time's up
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.submitQuiz();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async submitQuiz() {
    this.stopTimer();

    // Check if all questions are answered
    const unanswered = this.questions.filter(q => !this.answers[q.id]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered questions. Submit anyway?`
      );
      if (!confirm) return;
    }

    console.log('Submitting quiz...');

    const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: this.wallet,
          quizId: this.quizId,
          answers: this.answers,
          timeTaken
        })
      });

      const data = await response.json();

      if (data.success) {
        this.attemptId = data.attemptId;
        this.showResults(data.results);
      } else {
        throw new Error(data.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);

      // Calculate results locally as fallback
      const results = this.calculateResults(timeTaken);
      this.showResults(results);
    }
  }

  calculateResults(timeTaken) {
    let correctCount = 0;

    this.questions.forEach(question => {
      const selectedChoiceId = this.answers[question.id];
      const correctChoice = question.choices.find(c => c.is_correct);

      if (selectedChoiceId === correctChoice?.id) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / this.questions.length) * 100);
    const passed = percentage >= 80;

    return {
      correctCount,
      totalQuestions: this.questions.length,
      percentage,
      passed,
      timeTaken
    };
  }

  showResults(results) {
    // Switch to results screen
    this.showScreen('quiz-results');

    // Update icon and title based on pass/fail
    const icon = document.getElementById('results-icon');
    const title = document.getElementById('results-title');
    const message = document.getElementById('results-message');

    if (results.passed) {
      icon.textContent = '🎉';
      title.textContent = 'Congratulations!';
      message.textContent = 'You passed the Worldbridger One Training Quiz!';

      // Show certificate section
      document.getElementById('certificate-section').style.display = 'block';
      document.getElementById('retry-section').style.display = 'none';

      // Determine certificate type
      let certType = 'Standard Certificate';
      if (results.percentage === 100) {
        certType = '🏆 Perfect Score - Gold Certificate';
      } else if (results.percentage >= 90) {
        certType = '🥈 Advanced - Silver Certificate';
      }
      document.getElementById('certificate-type').textContent = certType;

    } else {
      icon.textContent = '😔';
      title.textContent = 'Not quite there yet';
      message.textContent = 'Keep learning and try again!';

      // Show retry section
      document.getElementById('certificate-section').style.display = 'none';
      document.getElementById('retry-section').style.display = 'block';
    }

    // Update score display
    document.getElementById('final-score').textContent = `${results.percentage}%`;
    document.getElementById('correct-count').textContent = results.correctCount;

    const minutes = Math.floor(results.timeTaken / 60);
    const seconds = results.timeTaken % 60;
    document.getElementById('time-taken').textContent =
      `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async mintCertificate() {
    const mintBtn = document.getElementById('mint-certificate-btn');
    const statusDiv = document.getElementById('minting-status');

    mintBtn.disabled = true;
    statusDiv.style.display = 'block';

    try {
      const response = await fetch('/api/quiz/mint-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: this.attemptId,
          walletAddress: this.wallet
        })
      });

      const data = await response.json();

      if (data.success) {
        statusDiv.innerHTML = `
          <div class="success-message">
            ✅ Certificate minted successfully!
            <br/>
            <a href="https://solscan.io/token/${data.nftAddress}?cluster=devnet" target="_blank">
              View on Solscan
            </a>
          </div>
        `;

        // Award XP
        await window.progressManager?.awardXP(100, 'quiz_passed', 'Passed training quiz');
      } else {
        throw new Error(data.error || 'Minting failed');
      }
    } catch (error) {
      console.error('Minting error:', error);
      statusDiv.innerHTML = `
        <div class="error-message">
          ❌ Failed to mint certificate. Please try again.
        </div>
      `;
      mintBtn.disabled = false;
    }
  }

  resetQuiz() {
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.timeRemaining = this.timeLimit;
    this.showScreen('quiz-intro');
    window.scrollTo(0, 0);
  }

  showScreen(screenId) {
    document.querySelectorAll('.quiz-screen').forEach(screen => {
      screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
  }

  showError(message) {
    alert(message); // TODO: Use better error display
  }

  formatCategory(category) {
    const categoryMap = {
      'platform': '🌍 Platform Basics',
      'battles': '⚔️ Rap Battles',
      'music': '🎵 Music Studio',
      'nft': '💎 NFT & Cards',
      'community': '👥 Community'
    };
    return categoryMap[category] || category;
  }

  getSampleQuestions() {
    // Return sample questions for demo
    return [
      {
        id: 'q1',
        question_text: 'What is Worldbridger One\'s primary mission?',
        category: 'platform',
        difficulty: 'easy',
        choices: [
          { id: 'q1a1', choice_text: 'To create the most profitable NFT marketplace', is_correct: false },
          { id: 'q1a2', choice_text: 'To empower youth through music, education, and blockchain technology', is_correct: true },
          { id: 'q1a3', choice_text: 'To compete with major record labels', is_correct: false },
          { id: 'q1a4', choice_text: 'To sell expensive NFTs to collectors', is_correct: false }
        ]
      },
      {
        id: 'q2',
        question_text: 'What percentage of marketplace sales supports Kakuma youth programs?',
        category: 'platform',
        difficulty: 'easy',
        choices: [
          { id: 'q2a1', choice_text: '2%', is_correct: false },
          { id: 'q2a2', choice_text: '5%', is_correct: true },
          { id: 'q2a3', choice_text: '10%', is_correct: false },
          { id: 'q2a4', choice_text: '15%', is_correct: false }
        ]
      }
      // Add more sample questions as needed
    ];
  }
}

// Export for use in other scripts
window.TrainingQuizManager = TrainingQuizManager;

console.log('Training Quiz Manager loaded');
