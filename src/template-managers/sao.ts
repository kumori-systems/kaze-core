import * as sao from 'sao';

// export interface Prompt {
//     message: string,
//     default: any
// }

export async function runTemplate(name: string, targetPath: string, params:{[name: string]: any}):Promise<void> {

    try {
        // If the template is downloaded, notify it to the user.
        sao.on('download:start', () => {
            console.log(`Downloading ${name}...`)
        })
        sao.on('download:stop', () => {
            console.log(`Downloaded ${name}...`)
        })

        // SAO templates engine configuration. Includes:
        // * template: the name of the template to be used.
        // * clone: if it is a git repository, clone the git instead of searching a zip file.
        // * targetPath: where the files will be stored.
        // * mockPrompts: instead of asking the user for the variables values, use the one provided in this dictionary.
        let config:SaoTemplateConfig = {
            template: name,
            clone: true,
            targetPath: targetPath,
            mockPrompts: params
        }

        // This disables the SAO templates library logger.
        sao.log.success = () => {}
        sao.log.error = (message) => {
            throw new Error(message)
        }
        sao.log.warn = () => {}
        sao.log.info = () => {}

        // Download and execute the SAP template
        await sao(config)
    } catch(error) {
        throw new Error(`Error downloading template: ${error.message || error}`)
    }
}

interface SaoTemplateConfig {
    template: string,
    clone: boolean,
    targetPath: string,
    mockPrompts?: {[name: string]: any}
}