const workPreview = require("./work-preview.js"),
    { getLinkPreview } = require("link-preview-js"),
    yaml = require("js-yaml"),
    widont = require("widont"),
    minifier = require("@sherby/eleventy-plugin-files-minifier")

module.exports = eleventyConfig => {
    workPreview.init({
        width: 700,
        outputDir: "works/previews/",
        locationPrefixes: {
            "works": "works/",
            "previews": "works/previews/"
        }
    })

    workPreview.addDomainHandler(["docs.google.com", "slides.google.com"], async src =>
        (await getLinkPreview(src))
            .images[0]
            .replace(/=.*$/, "")
    )

    eleventyConfig.addShortcode("work_preview", workPreview)
    eleventyConfig.addFilter("prefix_location", workPreview.prefixLocation)

    eleventyConfig.addFilter("widont", widont)

    eleventyConfig.addDataExtension("yaml", contents => yaml.safeLoad(contents))
    eleventyConfig.addPlugin(minifier)

    eleventyConfig.addPassthroughCopy("works/*")
    eleventyConfig.addPassthroughCopy("assets/**")
}
