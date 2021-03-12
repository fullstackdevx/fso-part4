const usersRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({})
    .populate('posts', { title: 1, author: 1, url: 1 })
  response.json(users)
})

usersRouter.get('/:id', async (request, response) => {
  const user = await User.findById(request.params.id)
    .populate('posts', { title: 1, author: 1, url: 1 })

  if (user) {
    response.json(user)
  } else {
    response.status(404).end()
  }
})

usersRouter.post('/', async (request, response) => {
  const body = request.body

  const PASSWORD_MIN_LENGTH = 3

  // Password validation
  if (!body.password) {
    return response.status(400).json({ error: 'Path `password` is required.' })
  }

  if (body.password.length < PASSWORD_MIN_LENGTH) {
    // return response.status(400).json({ error: 'The password must have at least 3 characters' })
    return response.status(400).json({ error: `Path \`password\` (\`${body.password}\`) is shorter than the minimum allowed length (${PASSWORD_MIN_LENGTH})` })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash
  })

  const savedUser = await user.save()
  response.status(201).json(savedUser)
})

module.exports = usersRouter
