function createBlobImageFromDataURI(dataURI) {
  const byteString = atob(dataURI.split(',')[1])
  const type = dataURI
    .split(',')[0]
    .split(':')[1]
    .split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  let ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type })
}

const delay = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

const storage = {
  get(key, fallback) {
    return (
      localStorage.getItem('IMGUR_UPLOADER_' + key.toUpperCase()) || fallback
    )
  },
  save(key, value) {
    return localStorage.setItem('IMGUR_UPLOADER_' + key.toUpperCase(), value)
  },
  clear(key) {
    return localStorage.removeItem('IMGUR_UPLOADER_' + key.toUpperCase())
  }
}

new Vue({
  el: '#app',
  data() {
    return {
      busy: false,
      token: storage.get('token', ''),
      items: JSON.parse(storage.get('items', '[]'))
    }
  },
  watch: {
    token(val) {
      storage.save('token', val)
    },
    items(val) {
      storage.save('items', JSON.stringify(val))
    }
  },
  methods: {
    clearUploads() {
      if (!window.confirm('Are you sure?')) {
        return
      }
      this.items = []
    },
    applyLink(raw, link) {
      this.items = this.items.map(item => (item === raw ? link : item))
    },
    upload(event) {
      if (!this.token) {
        alert('Imgur token is missing.')
        return
      }
      this.busy = true
      try {
        const { files } = event.target
        const file = files[0]
        if (!file) {
          return
        }
        const params = new FormData()
        const reader = new FileReader()
        reader.onload = async ({ currentTarget: { result } }) => {
          axios.defaults.headers.authorization = 'Client-ID ' + this.token
          this.items.unshift(result)
          params.append('image', createBlobImageFromDataURI(result))
          const { data } = await axios.post(
            'https://api.imgur.com/3/image',
            params
          )
          await delay(1000)
          this.applyLink(result, data.data.link)
          this.busy = false
        }
        reader.readAsDataURL(file)
      } catch (e) {
        alert('Error')
        this.busy = false
      }
    }
  }
})
