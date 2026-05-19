# contributing to memorywalk

## writing a walk

1. find the "write your own" link at the end of any published walk
2. log in with your GitHub account
3. create your walk — images are processed automatically through the 0.3MP pipeline
4. save drafts as you go; when ready, submit for review
5. a curator will review and publish your walk

### constraints

- images: processed to 640x480 through sensor emulation (automatic)
- page body: 400 words maximum
- walk length: 30 pages maximum
- bio: 50 words, one external link
- no video, audio, or animation
- no emoji in content

### content license

by submitting a walk, you agree to license your content under [CC BY-NC-SA 4.0](LICENSE-CONTENT) unless you specify an alternative CC variant or CC0 in your walk metadata. you retain copyright.

## contributing code

1. fork the repository
2. create a branch for your change
3. make your changes
4. open a pull request with a clear description

### development

```bash
npm install
npm run dev
```

### stack

- astro (typescript)
- decap CMS for content management
- leaflet + openstreetmap for the nexus map
- custom canvas2D pipeline for image processing
- hand-written CSS

### code of conduct

this project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
