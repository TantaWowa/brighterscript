import { LogLevel } from './Logger';

export interface BsConfig {
    /**
     * The inheritance tree for all parent configs used to generate this config. Do not set this, it is computed.
     */
    _ancestors?: string[];

    /**
     * A path to a project file. This is really only passed in from the command line, and should not be present in bsconfig.json files
     */
    project?: string;

    /**
     * Relative or absolute path to another bsconfig.json file that this file should import and then override
     */
    extends?: string;

    /**
     * Override the current working directory.
     */
    cwd?: string;

    /**
     * The root directory of your Roku project. Defaults to current directory.
     */
    rootDir?: string;

    /**
     * The list of file globs used to find all files for the project
     * If using the {src;dest;} format, you can specify a different destination directory
     * for the matched files in src.
     */
    files?: Array<string | { src: string | string[]; dest?: string }>;

    /**
     * The path where the output zip file should be placed.
     * @default "./out/package.zip"
     */
    outFile?: string;

    /**
     * Creates a zip package. Defaults to true. This setting is ignored when deploy is enabled.
     */
    createPackage?: boolean;

    /**
     * If true, the files are copied to staging. This setting is ignored when deploy is enabled or if createPackage is enabled
     */
    copyToStaging?: boolean;

    /**
     * If true, the server will keep running and will watch and recompile on every file change
     * @default false
     */
    watch?: boolean;

    /**
     * If true, after a successful buld, the project will be deployed to the roku specified in host
     */
    deploy?: boolean;

    /**
     * The host of the Roku that this project will deploy to
     */
    host?: string;

    /**
     * The username to use when deploying to a Roku device
     */
    username?: string;

    /**
     * The password to use when deploying to a Roku device
     */
    password?: string;

    /**
     * Prevent the staging folder from being deleted after creating the package
     * @default false
     */
    retainStagingFolder?: boolean;

    /**
     * The path to the staging folder (where all files are copied to right before creating the zip package)
     */
    stagingFolderPath?: string;

    /**
     * A list of error codes the compiler should NOT emit, even if encountered.
     */
    ignoreErrorCodes?: number[];

    /**
     * Emit full paths to files when printing diagnostics to the console. Defaults to false
     */
    emitFullPaths?: boolean;

    /**
     * A list of filters used to exclude diagnostics from the output
     */
    diagnosticFilters?: Array<number | string | { src: string; codes: number[] } | { src: string } | { codes: number[] }>;

    /**
     * Specify what diagnostic types should be printed to the console. Defaults to 'warn'
     */
    diagnosticLevel?: 'info' | 'hint' | 'warn' | 'error';

    /**
     * When enabled, every xml component will search for a .bs or .brs file with the same name
     * in the same folder, and add it as a script import if found. Disabled by default"
     */
    autoImportComponentScript?: boolean;
    /**
     * When enabled, diagnostics will be printed to the console.
     * When disabled, no diagnostics will be printed to the console.
     * @default true
     */
    showDiagnosticsInConsole?: boolean;
    /**
     * The log level.
     * @default LogLevel.log
     */
    logLevel?: LogLevel | 'error' | 'warn' | 'log' | 'info' | 'debug' | 'trace';
    /**
     * Override the path to source files in source maps. Use this if you have a preprocess step and want
     * to ensure the source maps point to the original location.
     * This will only alter source maps for files within rootDir. Any files found outside of rootDir will not
     * have their source maps changed. This option also affects the `SOURCE_FILE_PATH` and `SOURCE_LOCATION` source literals.
     */
    sourceRoot?: string;

    /**
     * Specify how to guard against accidental execution of code, when using ternary operator. This option changes how the
     * consequent(true part) and alternate (false part) will be wrapped. This is to prevent accidental code access
     * e.g, given `myValue = isTrue ? "say hello" : doSomeFunction()` ; the brs code will execute `doSomeFunction()` to evaluate it's value.
     * This can lead to unexpected side effects.
     * When `"safe"`, consequent and alternate will be wrapped in an inline function to prevent side effects if any function calls (e.g. s`omeNode.getValue()`)
     * or dotted gets, (e.g. `user.name`) are present in the consequent or alternate.
     * When `"none"`, consequent and alternate are left as is. This is not advised.
     */
    conditionalScopeProtection?: 'safe' | 'none';
}
