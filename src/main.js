const app = new Vue({
            el: '#app',
            data: {
                // Hardcoded lessons data
                lessons: [{
                        "id": 1,
                        "subject": "Piano Lessons",
                        "location": "London City",
                        "price": 50,
                        "spaces": 5
                    },
                    {
                        "id": 2,
                        "subject": "Guitar Lessons",
                        "location": "Manchester",
                        "price": 40, 
                        "spaces": 3
                    },
                    {
                        "id": 3,
                        "subject": "Math Tutoring",
                        "location": "Birmingham",
                        "price": 30,
                        "spaces": 4
                    }
                ],
                searchQuery: '',
                sortBy: 'subject',
                sortOrder: 'asc',
                cart: [],
                checkoutName: '',
                checkoutPhone: '',
                showCart: false
            },
            computed: {
                FilteredLessons() {
                    let filtered = this.lessons.filter(lesson =>
                        lesson.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        lesson.location.toLowerCase().includes(this.searchQuery.toLowerCase())
                    );

                    filtered.sort((a, b) => {
                        let modifier = this.sortOrder === 'asc' ? 1 : -1;
                        if (a[this.sortBy] < b[this.sortBy]) return -1 * modifier;
                        if (a[this.sortBy] > b[this.sortBy]) return 1 * modifier;
                        return 0;
                    });

                    return filtered;
                },
                cartTotal() {
                    return this.cart.reduce((total, item) => total + item.price, 0);
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
                }
            }
        });