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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}
