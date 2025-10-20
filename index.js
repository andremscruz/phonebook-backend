/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./models/person')

app.use(express.static('dist'))
app.use(express.json())
app.use(cors())



morgan.token('body', (req) => JSON.stringify(req.body))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

const currentDate = new Date()
const weekday = currentDate.toLocaleString('en-US', { weekday: 'long' })
const month = currentDate.toLocaleString('en-US', { month: 'long' })
const dayOfMonth = currentDate.getDate()
const year = currentDate.getFullYear()
const time = currentDate.toLocaleTimeString()

//FETCHES "HOME" PAGE
app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

//FETCHES INFO PAGE
app.get('/info', async (request, response) => {
  try {
    const personCount = await Person.countDocuments({})
    response.send(`
      <p>Phonebook has info for ${personCount} people</p> 
      <p>${weekday} ${month} ${dayOfMonth} ${year} ${time}</p>
    `)
  } catch (error) {
    console.error(error)
    response.status(500).send('Internal Server Error')
  }
})


//FETCHES ALL RESOURCES
app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => response.json(persons))
})

//FETCHES IDENTIFIED RESOURCE
app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

//CREATES NEW RESOURCE
app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (body.name === undefined || body.number === undefined) {
    return response.status(400).json({ error: 'content missing' })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
    favorite: false,
  })

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson)
    })
    .catch((error) => next(error))
})

//UPDATE IDENTIFIED RESOURCE
app.put('/api/persons/:id', (request, response, next) => {
  const { name, number, favorite } = request.body

  Person.findByIdAndUpdate(
    request.params.id, 
    { name, number, favorite },
    { new: true, runValidators: true, context: 'query' }
  ) 
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

//DELETES IDENTIFIED RESOURCE
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
