#!/usr/bin/env ruby
require 'fileutils'
require "optparse"
require 'rbconfig'
include RbConfig

NIL_UUID = "00000000-0000-0000-0000-000000000000";

def setup_build(config)

    if config.nil? || !config.is_a?(Object) || config.empty? || config.length == 0
        log("Invalid config argument", "error")
        exit(0)
    end

    log("Set Configurations : #{config}","warning")

    projectDir = config[:projectDir]

    if projectDir.end_with?("/")
        
    else
        projectDir = "#{projectDir}/"
    end

    #check Project Directory exist or not
    unless Dir.exist?(projectDir)
        log("Project Directory not found [#{projectDir}]",'error')
        exit(0)
    end

    #Check npx 
    unless command_exists?("npx")
        log("npx is not installed",'error')
        exit(0)
    end

    #Check React Native 
    unless system("npx react-native --version >/dev/null 2>&1")
        log("react-native not found",'error')
        log("Hint: npm install -g react-native-cli (optional)",'info')
        exit(0)
    end

    rnPackagePath = "#{projectDir}node_modules/react-native/package.json"
    unless File.exist?(rnPackagePath)
        log("react-native not installed in project [#{rnPackagePath}]",'error')
        exit(0)
    end

    outputDir = File.join(projectDir,config[:outputDir])

    #check Output Directory exist
    if Dir.exist?(outputDir)
        FileUtils.rm_rf(Dir.glob("#{outputDir}/*")) #Clear all File inside directory
        log("Clear Old Bundle Files","info")
    else
        Dir.mkdir(outputDir) # This will raise an error if parent directories are missing
    end

    #Added into .gitIgnore
    addToGitignore(projectDir,config[:outputDir])

    tempBundle = File.join(outputDir,"temp-bundle")

    #create temp-bundle to write all bundle file into the dir
    Dir.mkdir(tempBundle)

    generateBundleId = uuid_v7()

    bundleFile = File.join(tempBundle,"BUNDLE_ID")
    File.write(bundleFile,generateBundleId)

    #Generate Bundle
    bundleCommand({
        projectDir: projectDir,
        buildPath: tempBundle,
        platform: config[:platform],
        minify: config[:minify],
        enableHermes: config[:enableHermes],
        bundleId: generateBundleId
    })

    compileHermes({
        projectDir: projectDir,
        buildPath: tempBundle,
        platform: config[:platform],
        minify: config[:minify],
        enableHermes: config[:enableHermes],
        bundleId: generateBundleId,
        mergeSourceMap: config[:mergeSourceMapWithHermes]
    })

    zipCompressBundle({
        projectDir: projectDir,
        outputDir: config[:outputDir],
        buildPath: tempBundle,
        platform: config[:platform],
    })

    #
    build_success({
        projectDir: projectDir,
        outputDir: config[:outputDir]
    })
    #log("Invalid config argument", "error")
    exit(0)
end

def bundleCommand(options)

    projDir = options[:projectDir]

    buildPath = options[:buildPath]

    platform = options[:platform].downcase

    bundleId = options[:bundleId]

    isMinifyEnable = true
    unless options[:minify]
        isMinifyEnable = false
    end

    sourcemap = false
    # disable minify when enableHermes is true
    if options[:enableHermes]
        isMinifyEnable = true
        sourcemap = true
    end

    filename = "index.#{platform}.bundle"

    bundleOutput = File.join(buildPath, "#{filename}");

    commanCommand = [
        "cd",
        projDir,
        "&&",
        "npx",
        "react-native",
        "bundle",
        "--assets-dest",
        buildPath,
        "--bundle-output",
        bundleOutput,
        "--dev",
        false,
        "--entry-file",
        "index.js",
        "--platform",
        platform,
        "--minify",
        isMinifyEnable,
    ];

    sourceMapCommand = []
    if sourcemap
        sourceMapCommand = ["--sourcemap-output", "#{bundleOutput}.map"]
    end

    finalCommand = commanCommand.concat(sourceMapCommand).concat(["--reset-cache"])

    log(finalCommand.join(" "),"info")

    finalCommand = finalCommand.join(" ")
    begin
        output = executeCmd!(finalCommand, dryRun: true)
        puts output

        #If Sourcemap Required in case of enable hermes
        if sourcemap
            #Update Bundle Id in generated index.android.bundle
            setBundleIdInMinifyJs("#{bundleOutput}",bundleId)

            #verify Bundle Id from Bundle Package
            getBundelIdFromMinifyJs = getBundleIdInMinifyJs("#{bundleOutput}")

            if getBundelIdFromMinifyJs != bundleId
                FileUtils.rm_rf(Dir.glob("#{buildPath}/*"))
                log("Failed to Verify Bundle Id in Bundle Package [#{getBundelIdFromMinifyJs}]","error")
                exit(0)
            end

            log("Verified Bundle Id with Minify Bundle Package [#{getBundelIdFromMinifyJs}]","info")

            #Update Bundle Id in generated index.android.bundle.map
            setBundleIdInMapJs("#{bundleOutput}.map",bundleId)

            #verify Bundle Id from Map Bundle Package
            getBundelIdFromMapJs = getBundleIdFromMapJsFile("#{bundleOutput}.map")

            if getBundelIdFromMapJs != bundleId
                FileUtils.rm_rf(Dir.glob("#{buildPath}/*"))
                log("Failed to Verify Bundle Id in Map Bundle Package [#{getBundelIdFromMapJs}]","error")
                exit(0)
            end

            log("Verified Bundle Id of Map Js Bundle [#{getBundelIdFromMapJs}]","info")
        else

            if isMinifyEnable
                #Update Bundle Id in generated index.android.bundle
                setBundleIdInMinifyJs("#{bundleOutput}",bundleId)

                #verify Bundle Id from Bundle Package
                getBundelIdFromMinifyJs = getBundleIdInMinifyJs("#{bundleOutput}")

                if getBundelIdFromMinifyJs != bundleId
                    FileUtils.rm_rf(Dir.glob("#{buildPath}/*"))
                    log("Failed to Verify Bundle Id in Minify Bundle Package [#{getBundelIdFromMinifyJs}]","error")
                    exit(0)
                end

                log("Verified Bundle Id with Minify Bundle Package [#{getBundelIdFromMinifyJs}]","info")

            else
                #Update Bundle Id in generated index.android.bundle
                setBundleIdInJs("#{bundleOutput}",bundleId)

                #verify Bundle Id from Bundle Package
                getBundelIdFromJs = getBundleIdFromJsFile("#{bundleOutput}")

                if getBundelIdFromJs != bundleId
                    FileUtils.rm_rf(Dir.glob("#{buildPath}/*"))
                    log("Failed to Verify Bundle Id in Bundle Package [#{getBundelIdFromJs}]","error")
                    exit(0)
                end

                log("Verified Bundle Id of Js Bundle with unminify Code [#{getBundelIdFromJs}]","info")
            end
        end

    rescue => e
        FileUtils.rm_rf(Dir.glob("#{buildPath}/*")) #Clear all File inside directory
        log(e.message, "error")
        exit(0)
    end
end

def setBundleIdInMinifyJs(filePath, value)
    content = File.read(filePath)
    key = "IPAY_CODE_PUSH_BUNDLE_ID"
    pattern = /(#{Regexp.escape(key)}:)([^}]+)/

    content.gsub!(pattern, "\\1\"#{value}\"")

    File.write(filePath, content)
end

def getBundleIdInMinifyJs(filePath)
    content = File.read(filePath)
    key = "IPAY_CODE_PUSH_BUNDLE_ID"
    match = content.match(
        /(#{Regexp.escape(key)}\s*:\s*)([^}\s,]+)/
    )

    return nil unless match

    value = match[2].strip

    # Remove surrounding quotes if present
    value.gsub!(/\A["']|["']\z/, "")

    value
end

def setBundleIdInJs(filePath, value)
    content = File.read(filePath)

    pattern = /(IPAY_CODE_PUSH_BUNDLE_ID\s*:\s*)NIL_UUID/

    unless content.match?(pattern)
        log("Failed to set Bundle Id",'error')
        exit(0)
    end

    content.gsub!(pattern, "\\1\"#{value}\"")

    File.write(filePath, content)
    true
end

def getBundleIdFromJsFile(filePath)
    content = File.read(filePath)
    key = "IPAY_CODE_PUSH_BUNDLE_ID"
    match = content.match(
        /#{Regexp.escape(key)}\s*:\s*([^,\n}]+)/
    )

    return nil unless match

    value = match[1].strip

    # Remove surrounding quotes if present
    value.gsub!(/\A["']|["']\z/, "")

    value
end 

def setBundleIdInMapJs(filePath, value)
    content = File.read(filePath)
    key = "__IPAY_CODE_PUSH_BUNDLE_ID"
    pattern = /
        (const\s+#{Regexp.escape(key)}\s*=\s*)
        (undefined|null|["'][^"']*["'])
        \s*;
    /x

    if content.match?(pattern)
        content.gsub!(
        pattern,
        "\\1\"#{value}\";"
        )
    else
        content << "\nconst #{key} = \"#{value}\";\n"
    end

    File.write(filePath, content)
    true
end

def getBundleIdFromMapJsFile(filePath)
    content = File.read(filePath)
    key = "__IPAY_CODE_PUSH_BUNDLE_ID"
    regex = /
        (?:const|let|var)\s+#{Regexp.escape(key)}\s*=\s*
        (["'])(.*?)\1
        \s*;
    /x

    match = content.match(regex)
    return nil unless match

    match[2]
end

def compileHermes(options)
    projDir = options[:projectDir]

    buildPath = options[:buildPath]

    platform = options[:platform].downcase

    bundleId = options[:bundleId]

    unless options[:enableHermes]
        return true
    end

    log("Hermes is  enabled")

    hermesOSBin = getHermesOSBin()

    hermesOSExe = getHermesOSExe()

    filename = "index.#{platform}.bundle"

    inputJsFile = File.join(buildPath, "#{filename}")

    outputHbcFile ="#{inputJsFile}.hbc";

    hermesArgs = [
        "-w",
        "-O",
        "-emit-binary",
        "-max-diagnostic-width=80",
        "-out",
        outputHbcFile, # output file
        inputJsFile, # input file
    ]

    isMergeSourceMap = false
    if options[:mergeSourceMap]
        isMergeSourceMap = true
    end

    if isMergeSourceMap
        hermesArgs = hermesArgs.concat(["-output-source-map"])
    end

    finalHermesCmd = hermesArgs.join(" ")

    log("Hermes Command #{finalHermesCmd}")

    #Check Hermes Compiler Path

    # Since react-native 0.83+, Hermes compiler in 'hermes-compiler' package
    hermesCompilerPath = File.join(projDir,"node_modules","hermes-compiler","hermesc",getHermesOSBin(),getHermesOSExe())

    unless File.exist?(hermesCompilerPath)
        #Older React Native Hermes Path
        hermesCompilerPath = File.join(projDir,"node_modules","react-native","sdks","hermesc",getHermesOSBin(),getHermesOSExe())

        unless File.exist?(hermesCompilerPath)
            log("Hermes Compiler Path not found in New or Old React Native Versions #{hermesCompilerPath}","error")
            exit(0)
        end
    end

    #log("Hermes Path #{hermesCompilerPath}","info")
    
    finalCommand = hermesCompilerPath.concat(" ").concat(finalHermesCmd)

    log("Hermes Execution CMD : #{finalCommand}","info")

    begin
        output = executeCmd!(finalCommand, dryRun: true)
        puts output

        log("Hermes Code [hbc] Generated Successfully","info")

    rescue => e
        FileUtils.rm_rf(Dir.glob("#{buildPath}/*")) #Clear all File inside directory
        log(e.message, "error")
        exit(0)
    end

end

def zipCompressBundle(options)

    projectDir = options[:projectDir]

    outputDir = options[:outputDir]

    buildPath = options[:buildPath]

    platform = options[:platform]

    #create bundle to write all bundle file into the dir
    bundleFolder = File.join(projectDir,outputDir,"bundle")
    Dir.mkdir(bundleFolder)

    sourceDir = buildPath

    destinationDir = bundleFolder

    copyDirExcluding(sourceDir,destinationDir,exclude: [
        "index.android.bundle",
        "index.android.bundle.map"
    ])

    log("Bundle Dir : #{bundleFolder}")

    File.rename("#{bundleFolder}/index.android.bundle.hbc", "#{bundleFolder}/index.android.bundle")

    bundleZipOutput = File.join(projectDir,outputDir,"bundle.zip")

    zipCommand = [
        "zip",
        "-r",
        bundleZipOutput,
        bundleFolder
    ]

    zipCommand = zipCommand.join(" ")

    begin
        output = executeCmd!(zipCommand, dryRun: true)
        puts output

        log("Bundle Zip Created Successfully","success")

        generateFileHash({
            projectDir: projectDir,
            outputDir: outputDir,
            hashFilePath: bundleZipOutput
        })

    rescue => e
        FileUtils.rm_rf(Dir.glob("#{buildPath}/*")) #Clear all File inside directory
        log(e.message, "error")
        exit(0)
    end
end

def generateFileHash(options)

    hashFilePath = options[:hashFilePath]

    projectDir = options[:projectDir]

    outputDir = options[:outputDir]

    hashArgs = [
        "shasum",
        "--algorithm", 
        "256",
        hashFilePath
    ]

    hashCommand = hashArgs.join(" ")

    begin
        output = executeCmd!(hashCommand, dryRun: false)
        #puts output

        log("Generated Bundle Hash [#{output}]","success")

        File.write(File.join(projectDir,outputDir,"FILE_HASH"),output)

    rescue => e
        FileUtils.rm_rf(Dir.glob("#{buildPath}/*")) #Clear all File inside directory
        log(e.message, "error")
        exit(0)
    end

end

def copyDirExcluding(src, dest, exclude: [])
    raise "Source not found" unless Dir.exist?(src)

    FileUtils.mkdir_p(dest)

    Dir.glob("#{src}/**/*", File::FNM_DOTMATCH).each do |path|
        next if path =~ /\/\.\.?$/ # skip . and ..

        relative = path.sub("#{src}/", "")
        next if exclude.any? { |pattern| File.fnmatch?(pattern, relative) }

        target = File.join(dest, relative)

        if File.directory?(path)
            FileUtils.mkdir_p(target)
        else
            FileUtils.mkdir_p(File.dirname(target))
            FileUtils.copy_file(path, target)
        end
    end
end

def command_exists?(cmd)
    system("command -v #{cmd} >/dev/null 2>&1")
end

def executeCmd!(cmd, dryRun: false)

    if dryRun
        # Execute command but suppress all output
        system("#{cmd} > /dev/null 2>&1")
        return nil
    end

    output = IO.popen("#{cmd} 2>&1", &:read)
    status = $?.exitstatus

    if status != 0
        raise RuntimeError, "Command failed (#{status}): #{output}"
    end

    output
end

def addToGitignore(projectDir,entry)
    gitignore = "#{projectDir}.gitignore"

    # Normalize entry (ensure trailing slash for dirs)
    entry = entry.end_with?("/") ? entry : "#{entry}/"

    # Create .gitignore if missing
    File.write(gitignore, "") unless File.exist?(gitignore)

    lines = File.read(gitignore).lines.map(&:strip)

    if lines.include?(entry)
        #puts "ℹ️  Already ignored: #{entry}"
        return false
    end

    File.open(gitignore, "a") do |f|
        f.puts "\n#{entry}"
    end

    log("Added to .gitignore: #{entry}","info")
    true
end

def log(message,type="info")

    #logTag = colorize("[IpayCodePush Setup Log*] ",35)
    logTag = "ℹ️ INFO : "

    if type == "error"
        puts red("#{"❌ ERROR : "} #{message}")
    elsif type == "success"
        puts green("#{"✅ SUCCESS : "} #{message}")
    elsif type == "warning"
        puts yellow("#{"⚠️ WARNING : "} #{message}")
    else   
        puts blue("#{logTag} #{message}")
    end
    puts
end

def colorize(text, color_code)
  "\e[#{color_code}m#{text}\e[0m"
end

def red(text) 
    colorize(text, 31)
end

def green(text) 
    colorize(text, 32)
end

def yellow(text) 
    colorize(text, 33)
end

def blue(text) 
    colorize(text, 34) 
end

def uuid_v7()
  timestamp = (Time.now.to_f * 1000).to_i
  rand_bytes = Random.bytes(10)

  bytes = [
    (timestamp >> 40) & 0xff,
    (timestamp >> 32) & 0xff,
    (timestamp >> 24) & 0xff,
    (timestamp >> 16) & 0xff,
    (timestamp >> 8) & 0xff,
    timestamp & 0xff,
  ] + rand_bytes.bytes

  bytes[6] = (bytes[6] & 0x0f) | 0x70  # version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80  # variant RFC4122

  "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x" %
    bytes
end

def getHermesOSBin()
    case CONFIG['host_os']
    when /mswin|windows/i
        return "win64-bin"
    when /linux/i
        return "linux64-bin"
    when /darwin|mac os/i
        return "osx-bin"
    else
        return "linux64-bin"
    end
end

def getHermesOSExe()
    hermesExecutableName = "hermesc";

    if getHermesOSBin() == "win64-bin"
        return "#{hermesExecutableName}.exe"
    else
        return hermesExecutableName
    end
end

def welcome_screen
    puts "*" * 52
    puts "*#{' ' * 50}*"
    puts "*#{' ' * 16}W E L C O M E#{' ' * 21}*"
    puts "*#{' ' * 15}IPAY CODE PUSH#{' ' * 21}*"
    puts "*#{' ' * 10}GENERATE ANDROID/IOS BUNDLE#{' ' * 13}*"
    puts "*#{' ' * 50}*"
    puts "*" * 52
    puts
end

def build_success(options)
    puts
    sleep 0.5
    puts log("Bundle generated successfully [#{File.join(options[:projectDir],options[:outputDir])}]","success")
end

if __FILE__ == $0

    welcome_screen

    options = {
        projectDir: "./",
        outputDir: ".ipay-bundle",
        platform: nil,
        minify:true,
        enableHermes: false,
        mergeSourceMapWithHermes: false,
    }
    
    parser = OptionParser.new do |opts|
        opts.banner = "Usage: ruby generateBundle.rb [options]"

        opts.on("--projectDir PROJECT_DIR", "Project Directory Path or Default current Directory") do |v|
            options[:projectDir] = v
        end

        opts.on("--outputDir OUTPUT_DIR", "Output Directory of generated Bundle or Default Path ./.ipay-bundle") do |v|
            options[:outputDir] = v
        end

        opts.on("--platform PLATFORM", "Platform (ANDROID|IOS)") do |v|
            options[:platform] = v
        end

        opts.on("--minify MINIFY", "Enable to Minify the JS Bundle or Default true") do |v|
            if v == "false"
                options[:minify] = false
            elsif v == "true"
                options[:minify] = true
            else
                options[:minify] = v
            end
        end

        opts.on("--enableHermes ENABLE_HERMES", "Enable Hermes to convert bundle into binary code") do |v|
            if v == "false"
                options[:enableHermes] = false
            elsif v == "true"
                options[:enableHermes] = true
            else
                options[:enableHermes] = v
            end
        end

        opts.on("--mergeSourceMapWithHermes MERGE_SOURCE_MAP_WITH_HERMES", "Needs merged sourcemap with hermes for debugging") do |v|
            if v == "false"
                options[:mergeSourceMapWithHermes] = false
            elsif v == "true"
                options[:mergeSourceMapWithHermes] = true
            else
                options[:mergeSourceMapWithHermes] = v
            end
        end

        opts.on("--help", "Show this help") do
            puts opts
            exit
        end
    end

    parser.parse!

    sleep 0.5
    puts "➡️  Generating bundle..."
    puts

    # ----------------------------
    # Validation
    # ----------------------------
    validPlatform = ["ANDROID", "IOS"]

    if !validPlatform.include?(options[:platform])  
        log("Platform required (--platform ANDROID|IOS)","error")
        exit(0)
    end

    log("Configured Successfully","info")
    puts
    setup_build(options)
end