on run argv
    set inputPath to item 1 of argv
    set outputPath to item 2 of argv

    tell application "Microsoft Word"
        set theDocument to open file name inputPath
        save as theDocument file name outputPath file format format PDF
        close theDocument saving no
    end tell
end run
