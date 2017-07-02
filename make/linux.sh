# Make and install drup dev version.

pack=$(npm pack)
npm install -g $pack
rm $pack