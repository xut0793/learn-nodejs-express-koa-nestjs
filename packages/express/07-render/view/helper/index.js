/*
 * @Date         : 2024-01-07 16:28:15 星期0
 * @Author       : xut
 * @Description  : handlebars helper
 */

/**
 * 注入代码片段，比如 script
 *
 * @param {string} name
 * @param {object} options
 * @returns
 */
export function section(name, options) {
  if (!this._sections) this._sections = {}
  this._sections[name] = options.fn(this)
  return null
}
