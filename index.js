require('dotenv').config()
const express = require('express')
const fs = require('fs')
const path = require('path')
const nodemailer = require('nodemailer')
const axios = require('axios')
const cheerio = require('cheerio')
const cron = require('node-cron')

const app = express()
const PORT = 3000

app.use(express.json())
app.use(express.static('public'))

function readData() {
  const raw = fs.readFileSync('data.json', 'utf-8')
  return JSON.parse(raw)
}

function writeData(data) {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2))
}
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
})

function sendEmail(to, subject, body) {
  return transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    text: body
  })
}

app.post('/add-opportunity', async (req, res) => {
  const { url, title, deadline, earlyReminder } = req.body

  try {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const pageText = $('body').text()

    const deadlineMatch = pageText.match(
      /deadline[:\s]+([A-Za-z]+ \d{1,2},?\s*\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i
    )
    const scrapedDeadline = deadlineMatch ? deadlineMatch[1] : null

    const opportunities = readData()
    const newOpportunity = {
      id: Date.now(),
      url,
      title,
      deadline: deadline || scrapedDeadline || null,
      earlyReminder: earlyReminder || null,
      completed: false,
      createdAt: new Date().toISOString()
    }

    opportunities.push(newOpportunity)
    writeData(opportunities)

    res.json({ success: true, opportunity: newOpportunity, scrapedDeadline })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/opportunities', (req, res) => {
  const opportunities = readData()
  res.json(opportunities)
})

app.patch('/opportunities/:id/complete', (req, res) => {
  const opportunities = readData()
  const id = parseInt(req.params.id)
  const index = opportunities.findIndex(o => o.id === id)

  if (index === -1) return res.status(404).json({ success: false })

  opportunities[index].completed = true
  writeData(opportunities)
  res.json({ success: true })
})

app.delete('/opportunities/:id', (req, res) => {
  let opportunities = readData()
  const id = parseInt(req.params.id)
  opportunities = opportunities.filter(o => o.id !== id)
  writeData(opportunities)
  res.json({ success: true })
})

cron.schedule('0 9 * * *', async () => {
  const opportunities = readData()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const opportunity of opportunities) {
    if (opportunity.completed || !opportunity.deadline) continue

    const deadline = new Date(opportunity.deadline)
    deadline.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))

    if (opportunity.earlyReminder && daysUntil === parseInt(opportunity.earlyReminder)) {
      await sendEmail(
        process.env.REMINDER_EMAIL,
        `Early reminder: ${opportunity.title}`,
        `Hey! You wanted to start early on this one.\n\n${opportunity.title}\nDeadline: ${opportunity.deadline}\nLink: ${opportunity.url}\n\nYou set this reminder ${opportunity.earlyReminder} days before the deadline.`
      )
    }

    if (daysUntil === 3) {
      await sendEmail(
        process.env.REMINDER_EMAIL,
        `3 days left: ${opportunity.title}`,
        `Heads up! You have 3 days left to apply.\n\n${opportunity.title}\nDeadline: ${opportunity.deadline}\nLink: ${opportunity.url}`
      )
    }

    if (daysUntil === 1) {
      await sendEmail(
        process.env.REMINDER_EMAIL,
        `Last chance: ${opportunity.title}`,
        `Tomorrow is the deadline!\n\n${opportunity.title}\nDeadline: ${opportunity.deadline}\nLink: ${opportunity.url}`
      )
    }
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})