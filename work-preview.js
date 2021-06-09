const eleventyImg = require("@11ty/eleventy-img"),
    { getLinkPreview } = require("link-preview-js")

let options

function init(optionsObject) {
    console.log(`🔮 previews rendering at ${optionsObject.width}px`)
    options = optionsObject
}

async function image(src, alt) {
    const metadata = await eleventyImg(src, {
        widths: [options.width],
        outputDir: "_site/" + options.outputDir,
        urlPath: "/" + options.outputDir,
        svgShortCircuit: false,
        sharpWebpOptions: {
            nearLossless: true
        },
        sparkJpegOptions: {
            quality: 95
        }
    })

    return eleventyImg.generateHTML(metadata, {
        alt: alt,
        loading: "lazy",
        decoding: "async"
    })
}

let handlers = []

class Handler {
    constructor(test, imageProvider, label) {
        this.test = test
        this.imageProvider = imageProvider
        this.label = label
    }
}

function alertPass(src, label) {
    console.log(`🔮 preview ${src} processing as ${label}`)
}

function addHandler(test, imageProvider, label) {
    handlers.push(new Handler(
        src => {
            const result = test(src)
            if (result) alertPass(src, label)
            return result
        },
        imageProvider
    ))
}

function addDomainHandler(domains, imageProvider) {
    addHandler(
        src => RegExp(`^https?:\/\/(?:www\.)?(${domains
            .map(src => src.replace(/\./g, "%"))
            .map(src => src.replace(/\*/g, "."))
            .map(src => src.replace(/%/g, "\\."))
            .join("|")})`).test(src),
        imageProvider,
        domains.join(", ")
    )
}

function addFiletypeHandler(filetypes, imageProvider) {
    addHandler(
        src => RegExp`\.(${filetypes.join("|")})$`.test(src),
        imageProvider,
        filetypes.join(", ")
    )
}

const webpageHandler = new Handler(
    src => /http:\/\/(?:www)?.+\/(?!.*\.(?!html?|php))/.test(src),
    async src => {
        const image = (await getLinkPreview(src)).images[0]
        if (!image) throw new Error(`${src} has no preview image!`)
        return image
    },
    "webpage"
)

async function preview(src, alt) {
    for (handler of handlers) {
        if (handler.test(src)) {
            return await image(await handler.imageProvider(src), alt)
        }
    }

    if (webpageHandler.test(src)) {
        return await image(await webpageHandler.imageProvider(src), alt)
    }

    alertPass(src, "image")
    return await image(src, alt)
}

function prefixLocation(location, prefix) {
    if (prefix == "external") return location

    const prefixes = options.locationPrefixes
    if (prefix in prefixes) {
        return prefixes[prefix] + location
    } else {
        throw new Error(`${prefix} is not a registered location prefix!`)
    }
}

module.exports = preview
module.exports.init = init
module.exports.addHandler = addHandler
module.exports.addDomainHandler = addDomainHandler
module.exports.addFiletypeHandler = addFiletypeHandler
module.exports.prefixLocation = prefixLocation
