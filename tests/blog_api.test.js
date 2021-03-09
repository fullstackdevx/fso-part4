const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5
  }
]

beforeEach(async () => {
  await Blog.deleteMany({})

  for (const blog of initialBlogs) {
    const blogObject = new Blog(blog)
    await blogObject.save()
  }
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('returns the correct amount of blog posts', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(initialBlogs.length)
})

test('the unique identifier property of the blog posts is named id,', async () => {
  const response = await api.get('/api/blogs')
  const firstBlog = response.body[0]

  expect(firstBlog.id).toBeDefined()
  // expect(firstBlog).toHaveProperty('id')
  expect(firstBlog._id).toBeUndefined()
  // expect(firstBlog._id).not.toBeDefined()
  // expect(firstBlog).not.toHaveProperty('_id')
})

afterAll(() => {
  mongoose.connection.close()
})
