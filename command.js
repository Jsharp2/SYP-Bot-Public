module.exports = (client, aliases, callback) => {
  if (typeof aliases === 'string') {
    aliases = [aliases]
  }

    client.on('messageCreate', (message) => {
        let { content } = message

    aliases.forEach((alias) => {
      const command = `${alias}`

      if (content.startsWith(`${command} `) || content === command) {
        console.log(`Running the command ${command}`)
        callback(message)
      }
    })
  })
}
