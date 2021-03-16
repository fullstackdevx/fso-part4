const config = require('../utils/config')
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

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

const blogsInDb = async () => {
  const blogs = await Blog.find({})
    .populate('user', { username: 1, name: 1 })
  return blogs.map(blog => blog.toJSON())
}

const validNonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon', url: 'willremovethissoon' })
  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

const generateTokenFrom = ({ username, id }) => {
  const userForToken = {
    username,
    id
  }
  return jwt.sign(userForToken, config.SECRET)
}

module.exports = { initialBlogs, blogsInDb, validNonExistingId, usersInDb, generateTokenFrom }
