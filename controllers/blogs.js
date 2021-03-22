const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const config = require('../utils/config')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
    .populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
    .populate('user', { username: 1, name: 1 })
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.post('/', async (request, response) => {
  const { token, body } = request

  const decodedToken = await jwt.verify(token, config.SECRET)
  if (!token || !decodedToken) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  })

  const savedPost = await blog.save()
  user.posts = user.posts.concat(savedPost._id)
  await user.save()

  response.status(201).json(savedPost)
})

blogsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params
  const { token } = request

  const decodedToken = await jwt.verify(token, config.SECRET)
  if (!token || !decodedToken) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const post = await Blog.findById(id)

  if (post.user.toString() !== decodedToken.id.toString()) {
    return response.status(403).json({ error: "Deletion failed. The post doesn't belong to the specified user." })
  }

  await Blog.findByIdAndRemove(id)

  // remove the post in the user
  const user = await User.findById(decodedToken.id)
  user.posts = user.posts.filter(postId => postId.toString() !== id)
  await user.save()

  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const { id } = request.params

  const blog = {
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes
  }

  const opts = { new: true, runValidators: true }
  const updatedBlog = await Blog.findByIdAndUpdate(id, blog, opts)

  response.json(updatedBlog)
})

module.exports = blogsRouter
