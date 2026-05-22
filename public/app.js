const urlInput = document.getElementById('url')
const titleInput = document.getElementById('title')
const deadlineInput = document.getElementById('deadline')
const earlyReminderInput = document.getElementById('earlyReminder')
const addBtn = document.getElementById('addBtn')
const message = document.getElementById('message')
const list = document.getElementById('list')

async function loadOpportunities() {
  const res = await fetch('/opportunities')
  const opportunities = await res.json()

  if (opportunities.length === 0) {
    list.innerHTML = '<p class="empty">No opportunities yet. Add one above!</p>'
    return
  }

  list.innerHTML = opportunities.map(o => `
    <div class="opportunity-card ${o.completed ? 'completed' : ''}">
      <div class="card-title">${o.title}</div>
      <a class="card-url" href="${o.url}" target="_blank">${o.url}</a>
      <div class="card-meta">
        ${o.deadline ? `Deadline: ${o.deadline}` : 'No deadline set'}
        ${o.earlyReminder ? ` · Early reminder: ${o.earlyReminder} days before` : ''}
      </div>
      <div class="card-meta">
        ${o.completed ? '✅ Completed' : '⏳ Pending'}
      </div>
      <div class="card-actions">
        ${!o.completed ? `<button class="btn-complete" onclick="markComplete(${o.id})">Mark Complete</button>` : ''}
        <button class="btn-delete" onclick="deleteOpportunity(${o.id})">Delete</button>
      </div>
    </div>
  `).join('')
}

addBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim()
  const title = titleInput.value.trim()
  const deadline = deadlineInput.value
  const earlyReminder = earlyReminderInput.value

  if (!url || !title) {
    message.textContent = 'Please enter a link and title.'
    return
  }

  message.textContent = 'Adding...'
  addBtn.disabled = true

  try {
    const res = await fetch('/add-opportunity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title, deadline, earlyReminder })
    })

    const data = await res.json()

    if (data.success) {
      message.textContent = data.scrapedDeadline
        ? `Added! Found deadline: ${data.scrapedDeadline}`
        : 'Added! No deadline found — consider setting one manually.'
      urlInput.value = ''
      titleInput.value = ''
      deadlineInput.value = ''
      earlyReminderInput.value = ''
      loadOpportunities()
    } else {
      message.textContent = 'Something went wrong. Check the link and try again.'
    }
  } catch (err) {
    message.textContent = 'Error connecting to server.'
  }

  addBtn.disabled = false
})

async function markComplete(id) {
  await fetch(`/opportunities/${id}/complete`, { method: 'PATCH' })
  loadOpportunities()
}

async function deleteOpportunity(id) {
  await fetch(`/opportunities/${id}`, { method: 'DELETE' })
  loadOpportunities()
}

loadOpportunities()