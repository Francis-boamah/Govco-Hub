// quiz.js
(function(){
  const sidebar = document.getElementById('sidebar');
  document.getElementById('hamburger').addEventListener('click', ()=> sidebar.classList.add('show'));
  document.getElementById('closeSidebar')?.addEventListener('click', ()=> sidebar.classList.remove('show'));
})();
  
(function(){
  // Sample question bank per course – each question: text, choices[], correctIndex
  // For demo we include 40 sample MCQs per course to pick 25 randomly.
  const BANK = {
    ENGL101: generateSampleQuestions('ENGL101'),
    MATH101: generateSampleQuestions('MATH101'),
    CS101: generateSampleQuestions('CS101')
  };

  function generateSampleQuestions(prefix){
    const arr=[];
    for(let i=1;i<=40;i++){
      arr.push({
        id: `${prefix}_q${i}`,
        text: `${prefix} sample question ${i}: Choose the correct option.`,
        choices: [
          `Option A for ${i}`,
          `Option B for ${i}`,
          `Option C for ${i}`,
          `Option D for ${i}`
        ],
        correctIndex: Math.floor(Math.random()*4)
      });
    }
    return arr;
  }

  // UI
  const startBtn = document.getElementById('startQuiz');
  const quizArea = document.getElementById('quizArea');
  const qNumber = document.getElementById('qNumber');
  const qText = document.getElementById('questionText');
  const choicesDiv = document.getElementById('choices');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitQuiz');
  const results = document.getElementById('results');

  let questions = [], answers = [], current = 0;

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }

  startBtn.addEventListener('click', ()=>{
    const course = document.getElementById('courseSel').value;
    const bank = BANK[course] || [];
    // pick 25 random distinct questions
    const picked = shuffle([...bank]).slice(0,25);
    questions = picked;
    answers = new Array(25).fill(null);
    current = 0;
    renderQuestion();
    quizArea.style.display='block';
    results.style.display='none';
  });

  function renderQuestion(){
    const q = questions[current];
    qNumber.textContent = `Question ${current+1} / ${questions.length}`;
    qText.textContent = q.text;
    choicesDiv.innerHTML = '';
    q.choices.forEach((c,idx)=>{
      const btn = document.createElement('button');
      btn.className='choice';
      btn.textContent = c;
      if(answers[current] === idx) btn.style.backgroundColor='#e6f7ff';
      btn.addEventListener('click', ()=> {
        answers[current] = idx;
        renderQuestion();
      });
      choicesDiv.appendChild(btn);
    });
  }

  prevBtn.addEventListener('click', ()=> {
    if(current>0){ current--; renderQuestion() }
  });
  nextBtn.addEventListener('click', ()=> {
    if(current < questions.length-1){ current++; renderQuestion() }
  });

  submitBtn.addEventListener('click', ()=>{
    if(questions.length===0) return alert('Start a quiz first.');
    let score=0;
    questions.forEach((q,i)=>{ if(answers[i]===q.correctIndex) score++ });
    results.style.display='block';
    results.innerHTML = `<h3>Results</h3><p>Score: ${score}/${questions.length}</p>
      <p>${Math.round(score/questions.length*100)}% </p>
      <button id="reviewBtn">Review Answers</button>`;
    document.getElementById('reviewBtn').addEventListener('click', ()=> {
      // simple review: show question-by-question with correct highlights
      quizArea.style.display='block';
      current = 0;
      renderQuestion();
      // highlight correct after rendering
      setTimeout(()=> {
        const q = questions[current];
        Array.from(document.querySelectorAll('.choice')).forEach((el,idx)=>{
          el.style.border = '1px solid #eee';
          if(idx===q.correctIndex) el.style.outline='3px solid #9fe59f';
          if(answers[current]===idx && answers[current]!==q.correctIndex) el.style.backgroundColor='#ffd6d6';
        });
      },0);
    });
  });
})();


// quiz.js - Add this at the end of the file
// Simple account button update for pages without auth modal
const userKey = "govco_user_v1";
const accountBtn = document.getElementById('accountBtn');
if (accountBtn) {
    const user = JSON.parse(localStorage.getItem(userKey) || 'null');
    if (user) {
        accountBtn.textContent = user.name || user.email.split('@')[0];
        accountBtn.onclick = (e) => {
            const confirmed = confirm(`Signed in as ${user.name || user.email}\nTap OK to sign out.`);
            if (confirmed) {
                localStorage.removeItem(userKey);
                window.location.reload();
            }
        };
    } else {
        accountBtn.onclick = (e) => {
            window.location.href = 'auth.html';
        };
    }
}
