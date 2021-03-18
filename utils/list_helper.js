const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, blog) => sum + blog.likes
  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  if (typeof blogs === 'undefined') return
  if (blogs.length === 0) return {}

  const favorite = blogs.reduce((favorite, blog) => favorite.likes < blog.likes ? blog : favorite)
  return { title: favorite.title, author: favorite.author, likes: favorite.likes }
}

const mostBlogs = (blogs) => {
  const result = _.chain(blogs)
    .groupBy('author')
    .map((posts, author) => ({ author, likes: _.sumBy(posts, 'likes', 0) }))
    .reduce((mostBlog, currentBlog) => mostBlog.likes > currentBlog.likes ? mostBlog : currentBlog, {})
    .value()

  return result
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}
