const app = new Vue({
            el: '#app',
            data: {
                // Hardcoded lessons data
                // lessons: [{
                //         "id": 1,
                //         "subject": "Piano Lessons",
                //         "location": "London City",
                //         "price": 50,
                //         "spaces": 5
                //     },
                //     {
                //         "id": 2,
                //         "subject": "Guitar Lessons",
                //         "location": "Manchester",
                //         "price": 40, 
                //         "spaces": 3
                //     },
                //     {
                //         "id": 3,
                //         "subject": "Math Tutoring",
                //         "location": "Birmingham",
                //         "price": 30,
                //         "spaces": 4
                //     },
                //     {
                //         "id": 24,
                //         "subject": "Guitars Lessons",
                //         "location": "Manchester",
                //         "price": 40, 
                //         "spaces": 3
                //     },
                //     {
                //         "id": 43,
                //         "subject": "Maths Tutoring",
                //         "location": "Birmingham",
                //         "price": 30,
                //         "spaces": 4
                //     },
                // ],
                lessons: [],
                apiBaseUrl: 'http://localhost:3000/api',
                searchQuery: '',
                sortBy: 'subject',
                sortOrder: 'asc',
                cart: [],
                checkoutName: '',
                checkoutPhone: '',
                showCart: false,
                darkMode: false
            },
            computed: {
                FilteredLessons() {
                    let filtered = this.lessons;
                    if (this.searchQuery) {
                        const query = this.searchQuery.toLowerCase();
                        filtered = filtered.filter(lesson => 
                            lesson.subject.toLowerCase().includes(query) ||
                            lesson.location.toLowerCase().includes(query) ||
                            lesson.price.toString().includes(query) ||
                            lesson.spaces.toString().includes(query)
                        );
                    }
                    
                    // Sort
                    filtered = filtered.sort((a, b) => {
                        let aVal = a[this.sortBy];
                        let bVal = b[this.sortBy];
                        
                        if (typeof aVal === 'string') {
                            aVal = aVal.toLowerCase();
                            bVal = bVal.toLowerCase();
                        }
                        
                        if (this.sortOrder === 'asc') {
                            return aVal > bVal ? 1 : -1;
                        } else {
                            return aVal < bVal ? 1 : -1;
                        }
                    });
                    
                    return filtered;
                },
                cartTotal() {
                    return this.cart.reduce((total, item) => total + item.price, 0);
                },
                isNameValid() {
                    return /^[A-Za-z\s]+$/.test(this.checkoutName);
                },
                isPhoneValid() {
                    return /^\d+$/.test(this.checkoutPhone);
                },
                isCheckoutValid() {
                    return this.isNameValid && this.isPhoneValid && this.cart.length > 0;
                }

            },
            methods: {
                addToCart(lesson) {
                    this.cart.push(lesson);
                    this.lessons.find(l => l.id === lesson.id).spaces--;
                },
                removeFromCart(index) {
                    this.cart.splice(index, 1);
                },
                checkout() {
                    alert(`Thank you, ${this.checkoutName}! Your order totaling $${this.cartTotal} has been placed. We will contact you at ${this.checkoutPhone}.`);
                    this.cart = [];
                    this.checkoutName = '';
                    this.checkoutPhone = '';
                    this.showCart = false;
                },

                // FETCH LESSONS FROM BACKEND
                async fetchLessons() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/lessons`);
                        if (response.ok) {
                            this.lessons = await response.json();
                        } else {
                            console.error('Failed to fetch lessons');
                        }
                    } catch (error) {
                        console.error('Error fetching lessons:', error);
                    }
                },

                getSubjectIcon(subject) {
                    const icons = {
                        'Math': 'fas fa-calculator',
                        'English': 'fas fa-book',
                        'Music': 'fas fa-music',
                        'Science': 'fas fa-flask',
                        'Art': 'fas fa-palette',
                        'Piano': 'fas fa-keyboard',
                        'Guitar': 'fas fa-guitar',
                        'Crochet': 'fas fa-yarn',
                        'Robotics': 'fas fa-robot',
                        'Cooking': 'fas fa-utensils',
                        'Drama': 'fas fa-theater-masks',
                        'Karate': 'fas fa-fist-raised'
                    };
                    return icons[subject] || 'fas fa-graduation-cap';
                },

                getImageUrl(subject) {
                    const images = {
                        'Math': 'maths.jpg',
                        'English': 'english.jpg',
                        'Music': 'music.jpg',
                        'Science': 'science.jpg',
                        'Art': 'art.jpg',
                        'Piano': 'piano.jpg',
                        'Guitar': 'guitar.jpg',
                        'Crochet': 'crochet.jpg',
                        'Robotics': 'robotics.jpg',
                        'Cooking': 'cooking.jpg',
                        'Drama': 'drama.jpg',
                        'Karate': 'karate.jpg'

                    };
                    finalImage = images[subject] || 'default.jpg';
                    return `http://localhost:3000/images/${finalImage}`;
                },
                toggleDarkMode() {
            this.darkMode = !this.darkMode;
            if (this.darkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }

            },
            mounted() {
                // Fetch lessons when the app is mounted
                this.fetchLessons();
            }
        });