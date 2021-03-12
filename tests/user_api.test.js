const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/user')
const helper = require('./test_helper')

beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)

  const user1 = new User({ username: 'root', passwordHash })
  await user1.save()

  const user2 = new User({ username: 'superuser', passwordHash })
  await user2.save()
})

describe('when there is initially some user saved', () => {
  test('all users are returned', async () => {
    const response = await api.get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body).toHaveLength(2)
  })
})

describe('viewing a specific user', () => {
  test('succeeds with a valid id', async () => {
    const usersAtStart = await helper.usersInDb()

    const userToView = usersAtStart[0]

    const resultUser = await api
      .get(`/api/users/${userToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultUser.body).toEqual(userToView)
  })
})

describe('addition of a new user', () => {
  test('succeeds with valid data', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('fails with status code 400 and proper message if username is not given', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = { name: 'name', password: 'secret' }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(result.body.error).toContain('`username` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('fails with status code 400 and proper message if password is not given', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = { userName: 'validUsername', name: 'name' }
    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(result.body.error).toContain('`password` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('fails with status code 400 and proper message if username has less than 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = { username: 'us', name: 'name', password: 'secret' }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(result.body.error).toContain('`username` (`us`) is shorter than the minimum allowed length (3)')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('fails with status code 400 and proper message if password has less than 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = { username: 'validUsername', name: 'name', password: 'se' }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(result.body.error).toContain('`password` (`se`) is shorter than the minimum allowed length (3)')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('fails with statuscode 400 and proper message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
