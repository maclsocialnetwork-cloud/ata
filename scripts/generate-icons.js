const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const input = path.resolve(__dirname, '../public/logo-ata.jpg')
const outputDir = path.resolve(__dirname, '../public/icons')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

async function generate() {
  for (const size of sizes) {
    const output = path.join(outputDir, `icon-${size}x${size}.png`)
    await sharp(input)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(output)
    console.log(`✓ icon-${size}x${size}.png`)
  }
  console.log(`\nIcones générées dans ${outputDir}`)
}

generate().catch(err => { console.error(err); process.exit(1) })
