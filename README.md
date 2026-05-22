# Opportunity Tracker

A full stack web app that helps you track opportunities like internships, jobs, and scholarships — so nothing gets lost in a group chat.

## Features

- Paste any link and the app automatically tries to find the deadline
- Manually set a deadline if none is found
- Email reminders 3 days and 1 day before the deadline
- Optional early reminder for longer applications
- Mark opportunities as complete
- Delete opportunities you no longer need

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Email:** Nodemailer + Gmail
- **Scraping:** Axios, Cheerio
- **Scheduling:** node-cron

## Setup

1. Clone the repo
```bash
   git clone https://github.com/karenemily/opportunity-tracker.git
```
2. Install dependencies
```bash
   npm install
```
3. Create a `.env` file in the root folder