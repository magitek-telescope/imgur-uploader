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

new Vue({
  el: '#app',
  data() {
    return {
      busy: false,
      token: localStorage.getItem('token') || '',
      items: JSON.parse(localStorage.getItem('items') || '[]')
    }
  },
  watch: {
    token(val) {
      localStorage.setItem('token', val)
    },
    items(val) {
      localStorage.setItem('items', JSON.stringify(val))
    }
  },
  methods: {
    upload(event) {
      if (!this.token) {
        alert('トークンを設定してください')
        return
      }
      this.busy = false
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
          setTimeout(() => {
            this.items = this.items.map(i =>
              i === result ? data.data.link : i
            )
            this.busy = false
          }, 1000)
        }
        reader.readAsDataURL(file)
      } catch (e) {
        alert('だめぽ')
        this.busy = false
      }
    }
  }
})
