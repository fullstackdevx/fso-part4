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
  const postsByAuthor = _.groupBy(blogs, 'author')

  const likesByAuthor = _.map(postsByAuthor, (posts, author) => {
    return { author, likes: _.reduce(posts, (acc, post) => acc + post.likes, 0) }
  })

  const result = _.reduce(likesByAuthor, (mostBlog, currentBlog) => {
    return mostBlog.likes > currentBlog.likes ? mostBlog : currentBlog
  }, {})

  return result
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}
