const STORAGE_KEY = "flashcardquiz.deck.v1";

const DEFAULT_CARDS = [
  { id: "default-1", question: "What is the largest planet in our solar system?", answer: "Jupiter." },
  { id: "default-2", question: "Which language is primarily used to add interactivity to web pages?", answer: "JavaScript." },
  { id: "default-3", question: "What does CPU stand for?", answer: "Central Processing Unit." },
  { id: "default-4", question: "How many sides does a hexagon have?", answer: "Six." },
  { id: "default-5", question: "What is the chemical symbol for gold?", answer: "Au." },
  { id: "default-6", question: "Who proposed the theory of general relativity?", answer: "Albert Einstein." },
  { id: "default-7", question: "What does HTML stand for?", answer: "HyperText Markup Language." },
  { id: "default-8", question: "Which ocean is the largest on Earth?", answer: "The Pacific Ocean." },
  { id: "default-9", question: "What is the binary representation of the decimal number 5?", answer: "101." },
  { id: "default-10", question: "Which planet is known as the Red Planet?", answer: "Mars." }
];

const elements = {
  card: document.querySelector("#flashcard"),
  question: document.querySelector("#question-text"),
  answer: document.querySelector("#answer-text"),
  counter: document.querySelector("#card-counter"),
  assessment: document.querySelector("#assessment"),
  rightButton: document.querySelector("#right-button"),
  reviewButton: document.querySelector("#review-button"),
  previousButton: document.querySelector("#previous-button"),
  nextButton: document.querySelector("#next-button"),
  shuffleButton: document.querySelector("#shuffle-button"),
  deleteButton: document.querySelector("#delete-button"),
  resetButton: document.querySelector("#reset-button"),
  restoreButton: document.querySelector("#restore-button"),
  form: document.querySelector("#card-form"),
  questionInput: document.querySelector("#question-input"),
  answerInput: document.querySelector("#answer-input"),
  status: document.querySelector("#status-message"),
  score: document.querySelector("#score-number"),
  rightCount: document.querySelector("#right-count"),
  reviewCount: document.querySelector("#review-count"),
  progressBar: document.querySelector("#progress-bar"),
  progressFill: document.querySelector("#progress-fill")
};

let cards = loadDeck();
let currentIndex = 0;
let isFlipped = false;
const results = new Map();

function loadDeck() {
  try {
    const savedDeck = localStorage.getItem(STORAGE_KEY);
    if (savedDeck === null) return DEFAULT_CARDS.map((card) => ({ ...card }));

    const parsedDeck = JSON.parse(savedDeck);
    if (!Array.isArray(parsedDeck) || !parsedDeck.every(isValidCard)) {
      throw new Error("Saved deck has an invalid format.");
    }
    return parsedDeck;
  } catch (error) {
    console.error("Could not load the saved flashcard deck:", error);
    window.addEventListener("DOMContentLoaded", () => {
      setStatus("The saved deck could not be loaded. Your default deck is ready.", true);
    }, { once: true });
    return DEFAULT_CARDS.map((card) => ({ ...card }));
  }
}

function isValidCard(card) {
  return card &&
    typeof card.id === "string" &&
    typeof card.question === "string" &&
    typeof card.answer === "string" &&
    card.question.trim() !== "" &&
    card.answer.trim() !== "";
}

function saveDeck() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    return true;
  } catch (error) {
    console.error("Could not save the flashcard deck:", error);
    setStatus("Your browser could not save the deck. Check local storage settings.", true);
    return false;
  }
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("is-error", isError);
}

function render() {
  const hasCards = cards.length > 0;
  elements.card.hidden = !hasCards;
  elements.assessment.hidden = !hasCards || !isFlipped;
  elements.previousButton.disabled = !hasCards;
  elements.nextButton.disabled = !hasCards;
  elements.shuffleButton.disabled = cards.length < 2;
  elements.deleteButton.disabled = !hasCards;
  elements.counter.textContent = hasCards ? `Card ${currentIndex + 1} of ${cards.length}` : "No cards in your deck";

  if (hasCards) {
    const currentCard = cards[currentIndex];
    elements.question.textContent = currentCard.question;
    elements.answer.textContent = currentCard.answer;
    elements.card.classList.toggle("is-flipped", isFlipped);
    elements.card.setAttribute("aria-label", isFlipped
      ? `Answer: ${currentCard.answer}. Press Space to flip back.`
      : `Question: ${currentCard.question}. Press Space to reveal the answer.`);
  }

  renderProgress();
}

function renderProgress() {
  let correct = 0;
  let needsReview = 0;
  for (const result of results.values()) {
    if (result === "right") correct += 1;
    if (result === "review") needsReview += 1;
  }

  const assessed = correct + needsReview;
  const percentage = assessed === 0 ? 0 : Math.round((correct / assessed) * 100);
  elements.score.textContent = `${percentage}%`;
  elements.rightCount.textContent = String(correct);
  elements.reviewCount.textContent = String(needsReview);
  elements.progressFill.style.width = `${percentage}%`;
  elements.progressBar.setAttribute("aria-valuenow", String(percentage));
}

function flipCard() {
  if (cards.length === 0) return;
  isFlipped = !isFlipped;
  elements.assessment.hidden = !isFlipped;
  elements.card.classList.toggle("is-flipped", isFlipped);
  elements.card.setAttribute("aria-label", isFlipped
    ? `Answer: ${cards[currentIndex].answer}. Press Space to flip back.`
    : `Question: ${cards[currentIndex].question}. Press Space to reveal the answer.`);
}

function goToCard(index) {
  if (cards.length === 0) return;
  currentIndex = (index + cards.length) % cards.length;
  isFlipped = false;
  setStatus("");
  render();
}

function assess(result) {
  if (cards.length === 0 || !isFlipped) return;
  results.set(cards[currentIndex].id, result);
  renderProgress();
  if (cards.length > 1) {
    goToCard(currentIndex + 1);
    setStatus(result === "right" ? "Marked right. On to the next card!" : "Added to review. On to the next card!");
  } else {
    isFlipped = false;
    render();
    setStatus(result === "right" ? "Marked right. That's your whole deck!" : "Added to review. That's your whole deck!");
  }
}

function shuffleDeck() {
  if (cards.length < 2) return;
  const currentCardId = cards[currentIndex].id;
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[randomIndex]] = [cards[randomIndex], cards[i]];
  }
  currentIndex = cards.findIndex((card) => card.id === currentCardId);
  isFlipped = false;
  render();
  setStatus("Your deck has been shuffled.");
}

function deleteCurrentCard() {
  if (cards.length === 0) return;
  const [deletedCard] = cards.splice(currentIndex, 1);
  results.delete(deletedCard.id);
  if (currentIndex >= cards.length) currentIndex = Math.max(0, cards.length - 1);
  isFlipped = false;
  if (saveDeck()) setStatus(cards.length ? "The card was deleted." : "The deck is empty. Add a card or restore the defaults.");
  render();
}

elements.card.addEventListener("click", flipCard);
elements.previousButton.addEventListener("click", () => goToCard(currentIndex - 1));
elements.nextButton.addEventListener("click", () => goToCard(currentIndex + 1));
elements.shuffleButton.addEventListener("click", shuffleDeck);
elements.deleteButton.addEventListener("click", deleteCurrentCard);
elements.rightButton.addEventListener("click", () => assess("right"));
elements.reviewButton.addEventListener("click", () => assess("review"));

elements.resetButton.addEventListener("click", () => {
  results.clear();
  isFlipped = false;
  render();
  setStatus("Progress has been reset.");
});

elements.restoreButton.addEventListener("click", () => {
  cards = DEFAULT_CARDS.map((card) => ({ ...card }));
  currentIndex = 0;
  isFlipped = false;
  results.clear();
  if (saveDeck()) setStatus("Your default deck has been restored.");
  render();
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = elements.questionInput.value.trim();
  const answer = elements.answerInput.value.trim();
  if (!question || !answer) {
    setStatus("Please enter both a question and an answer.", true);
    return;
  }

  const card = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    question,
    answer
  };
  cards.push(card);
  currentIndex = cards.length - 1;
  isFlipped = false;
  elements.form.reset();
  if (saveDeck()) setStatus("Your flashcard was added.");
  render();
  elements.questionInput.focus();
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName));
  if (isTyping || event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.code === "Space") {
    event.preventDefault();
    flipCard();
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    goToCard(currentIndex - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    goToCard(currentIndex + 1);
  }
});

render();
