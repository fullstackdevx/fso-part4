const config = require('../utils/config')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./test_helper')

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  // Create the user
  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', passwordHash })
  const { id: userId } = await user.save()

  // Create the blogs and assign the created user id
  const postObjects = helper.initialBlogs
    .map(post => new Blog({ ...post, user: userId }))
  const promiseArray = postObjects.map(post => post.save())
  const results = await Promise.all(promiseArray)

  // Update the user with the created posts ids
  const blogIds = results.map(blog => blog.id)
  user.posts = user.posts.concat(blogIds)

  await user.save()
})

describe('when there is initially some post saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all posts are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('the unique identifier of a post is named id,', async () => {
    const response = await api.get('/api/blogs')
    const firstBlog = response.body[0]

    expect(firstBlog.id).toBeDefined()
    expect(firstBlog._id).toBeUndefined()
  })
})

describe('viewing a specific post', () => {
  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToView = blogsAtStart[0]

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultBlog.body).toEqual(blogToView)
  })

  test('fails with statuscode 404 if post does not exist', async () => {
    const validNonexistingId = await helper.validNonExistingId()

    await api
      .get(`/api/blogs/${validNonexistingId}`)
      .expect(404)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '123'

    await api
      .get(`/api/blogs/${invalidId}`)
      .expect(400)
  })
})

describe('addition of a new post', () => {
  test('succeeds with valid data', async () => {
    const usersAtStart = await helper.usersInDb()

    // token creation
    const userForToken = {
      username: usersAtStart[0].username,
      id: usersAtStart[0].id
    }
    const token = jwt.sign(userForToken, config.SECRET)

    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12
    }

    const responseBlog = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')
    const titles = response.body.map(blog => blog.title)

    expect(response.body).toHaveLength(helper.initialBlogs.length + 1)
    expect(titles).toContain(newBlog.title)

    // testing if user has the new post
    const responseUser = await api.get(`/api/users/${responseBlog.body.user}`)
    expect(responseUser.body.posts).toHaveLength(usersAtStart[0].posts.length + 1)

    const userPosts = responseUser.body.posts.map(post => post.id)
    expect(userPosts).toContain(responseBlog.body.id)
  })

  test('fails with status code 401 and proper message if token is not provided', async () => {
    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12
    }

    const response = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)

    expect(response.body.error).toContain('invalid token')

    const { body: postsAtEnd } = await api.get('/api/blogs')
    expect(postsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('missing likes will default to zero', async () => {
    const usersAtStart = await helper.usersInDb()

    // token creation
    const userForToken = {
      username: usersAtStart[0].username,
      id: usersAtStart[0].id
    }
    const token = jwt.sign(userForToken, config.SECRET)

    const newBlog = {
      title: 'TDD harms architecture',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html'
    }

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)

    expect(response.body.likes).toBe(0)
  })

  test('fails with status code 400 if data invalid', async () => {
    const usersAtStart = await helper.usersInDb()

    // token creation
    const userForToken = {
      username: usersAtStart[0].username,
      id: usersAtStart[0].id
    }
    const token = jwt.sign(userForToken, config.SECRET)

    const newBlog = { author: 'Robert C. Martin' }
    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(400)

    const blogAtEnd = await helper.blogsInDb()

    expect(blogAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('update of a post', () => {
  test('succeeds with valid data', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const updatedBlog = {
      title: blogToUpdate.title,
      author: blogToUpdate.author,
      url: blogToUpdate.url,
      likes: 2
    }

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)

    expect(response.body.likes).toBe(updatedBlog.likes)
    expect(response.body.likes).not.toBe(blogToUpdate.likes)
  })

  test('fails with status code 400 if data invalid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const updatedBlog = {
      title: blogToUpdate.title,
      author: blogToUpdate.author,
      likes: 2
    }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(400)

    const blogAtEnd = await api.get(`/api/blogs/${blogToUpdate.id}`)
    expect(blogAtEnd.body).toEqual(blogsAtStart[0])
  })
})

describe('deletion of a post', () => {
  test('succeeds with status code 204 if id is valid and if the user is the same who added the post', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    // token creation
    const usersAtStart = await helper.usersInDb()
    const userForToken = {
      username: usersAtStart[0].username,
      id: usersAtStart[0].id
    }
    const token = jwt.sign(userForToken, config.SECRET)

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain(blogToDelete.title)

    // Check that user does not have the id of the post
    const user = await User.findById(usersAtStart[0].id)
    const postIds = user.posts.map(id => id.toString())
    expect(postIds).not.toContain(blogToDelete.id.toString())
  })

  test('Fails with status code 400 if a blog if the post does not belong to the user', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    // Create a new user
    const passwordHash = await bcrypt.hash('pass', 10)
    const user = new User({ username: 'mluukkai', passwordHash })
    const newUser = await user.save()

    // token creation
    const userForToken = {
      username: newUser.username,
      id: newUser.id
    }
    const token = jwt.sign(userForToken, config.SECRET)

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

    // Check if user has the id of the post
    const userCreator = await User.findById(blogToDelete.user.id)
    const postIds = userCreator.posts.map(id => id.toString())
    expect(postIds).toContain(blogToDelete.id.toString())
  })
})

afterAll(() => {
  mongoose.connection.close()
})
