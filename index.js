/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

// ====== MIDDLEWARE ======
app.use(express.json())       // Parse JSON bodies
app.use(cors())               // Enable CORS

// Morgan logging, including request body
morgan.token('body', (req) => JSON.stringify(req.body))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

// ====== DATABASE ======
mongoose.set('strictQuery', false)
const url = process.env.MONGODB_URI
console.log('connecting to', url)

mongoose.connect(url)
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Error connecting to MongoDB:', error.message))

// ====== ROUTES ======

// Root route
app.get('/', (req, res) => {
  res.send('<h1>Phonebook API is running</h1>')
})

// Info route
app.get('/info', async (req, res) => {
  try {
    const count = await Person.countDocuments({})
    res.send(`<p>Phonebook has info for ${count} people</p>`)
  } catch (error) {
    console.error(error)
    res.status(500).send('Internal Server Error')
  }
})

// Get all persons
app.get('/api/persons', async (req, res, next) => {
  try {
    const persons = await Person.find({})
    res.json(persons)
  } catch (error) {
    next(error)
  }
})

// Get one person by ID
app.get('/api/persons/:id', async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id)
    if (person) res.json(person)
    else res.status(404).end()
  } catch (error) {
    next(error)
  }
})

// Create new person
app.post('/api/persons', async (req, res, next) => {
  const { name, number } = req.body
  if (!name || !number) return res.status(400).json({ error: 'content missing' })

  const person = new Person({ name, number, favorite: false })
  try {
    const savedPerson = await person.save()
    res.json(savedPerson)
  } catch (error) {
    next(error)
  }
})

// Update person
app.put('/api/persons/:id', async (req, res, next) => {
  const { name, number, favorite } = req.body
  try {
    const updatedPerson = await Person.findByIdAndUpdate(
      req.params.id,
      { name, number, favorite },
      { new: true, runValidators: true, context: 'query' }
    )
    res.json(updatedPerson)
  } catch (error) {
    next(error)
  }
})

// Delete person
app.delete('/api/persons/:id', async (req, res, next) => {
  try {
    await Person.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

// ====== ERROR HANDLER ======
app.use((error, req, res, next) => {
  console.error(error.message)
  if (error.name === 'CastError') return res.status(400).send({ error: 'malformatted id' })
  if (error.name === 'ValidationError') return res.status(400).json({ error: error.message })
  next(error)
})

// ====== START SERVER ======
const PORT = process.env.PORT || 3003
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

