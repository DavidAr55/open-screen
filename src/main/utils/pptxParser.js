import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'

/**
 * Extrae solo texto de un .pptx — imágenes y demás media se ignoran
 * porque nunca se leen sus bytes, solo el XML de cada slide.
 *
 * Con preserveOrder:true, cada nodo es un objeto con UNA sola clave de
 * tag (más ':@' para atributos); el valor de esa clave es el array de
 * HIJOS de ese tag — no una lista de tags hermanos del mismo nombre
 * (los hermanos aparecen como objetos separados en el array del padre).
 */
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  preserveOrder: true,
  trimValues: false, // preserva espacios entre runs (ej. "Chorus " + "line" -> "Chorus line")
})

/** Recorre node buscando todo elemento cuya clave sea tagName, y llama visit(element). */
function walkTag(node, tagName, visit) {
  if (Array.isArray(node)) {
    for (const child of node) walkTag(child, tagName, visit)
    return
  }
  if (node == null || typeof node !== 'object') return

  if (tagName in node) {
    visit(node)
    return
  }

  for (const key of Object.keys(node)) {
    if (key === ':@' || key === '#text') continue
    walkTag(node[key], tagName, visit)
  }
}

function textOfRun(tEl) {
  const children = tEl['a:t']
  if (!Array.isArray(children)) return ''
  return children.map(c => (c && typeof c === 'object' && '#text' in c) ? String(c['#text']) : '').join('')
}

function textOfParagraph(pEl) {
  const parts = []
  walkTag(pEl['a:p'], 'a:t', t => parts.push(textOfRun(t)))
  return parts.join('')
}

/** Extrae el texto de un slide ya parseado, párrafo por párrafo, en orden de documento. */
function extractSlideText(parsedSlide) {
  const lines = []
  walkTag(parsedSlide, 'a:p', p => lines.push(textOfParagraph(p).trim()))

  while (lines.length && !lines[0]) lines.shift()
  while (lines.length && !lines[lines.length - 1]) lines.pop()

  return lines.join('\n')
}

function attrsOf(el) {
  return el[':@'] ?? {}
}

/**
 * Resuelve el orden real de los slides via presentation.xml (p:sldId → r:id)
 * + presentation.xml.rels (rId → archivo), en vez de confiar en el nombre
 * de archivo (que no siempre coincide con el orden si se reordenaron slides).
 */
async function resolveSlideOrder(zip) {
  const presXml = await zip.file('ppt/presentation.xml')?.async('text')
  const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text')
  if (!presXml || !relsXml) return null

  const relMap = new Map()
  walkTag(xmlParser.parse(relsXml), 'Relationship', el => {
    const attrs = attrsOf(el)
    const id     = attrs['@_Id']
    const target = attrs['@_Target']
    if (id && target) relMap.set(id, target)
  })

  const rIds = []
  walkTag(xmlParser.parse(presXml), 'p:sldId', el => {
    const rId = attrsOf(el)['@_r:id']
    if (rId) rIds.push(rId)
  })

  if (!rIds.length) return null

  const order = rIds
    .map(rId => relMap.get(rId))
    .filter(Boolean)
    .map(target => target.replace(/^\.?\/?/, '').replace(/^slides\//, ''))
    .map(name => `ppt/slides/${name}`)

  return order.length ? order : null
}

/**
 * Parsea un buffer de .pptx y retorna { slides: [{ index, text }] }
 * Solo texto — nunca se leen imágenes ni demás media embebida.
 */
export async function parsePptx(buffer) {
  const zip = await JSZip.loadAsync(buffer)

  let slidePaths = await resolveSlideOrder(zip)

  if (!slidePaths) {
    slidePaths = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)\.xml$/)[1], 10)
        const nb = parseInt(b.match(/slide(\d+)\.xml$/)[1], 10)
        return na - nb
      })
  }

  const slides = []
  for (let i = 0; i < slidePaths.length; i++) {
    const file = zip.file(slidePaths[i])
    if (!file) continue
    const xml = await file.async('text')
    const parsed = xmlParser.parse(xml)
    slides.push({ index: i, text: extractSlideText(parsed) })
  }

  return { slides }
}
