const app = new Vue({
            el: '#app',
            data: {
                lessons: [],
                // apiBaseUrl: 'http://localhost:3000/api',
                apiBaseUrl: 'https://studyhere-backend-1-1vqv.onrender.com/api',
                searchQuery: '',
                sortBy: 'subject',
                sortOrder: 'asc',
                cart: [],
                checkoutName: '',
                checkoutPhone: '',
                showCart: false,
                darkMode: false,
                showOrderModal: false,
                orderModalTitle: '',
                orderModalMessage: '',
                orderModalType: 'info', // 'success' | 'error' | 'info'
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
                cartTotalPrice() {
                    return this.cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
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
                    if (lesson.spaces > 0) {
                        // Check if lesson already in cart
                        const existingCartItem = this.cart.find(item => item.id === lesson.id);
                        
                        if (existingCartItem) {
                            // Increment quantity if already in cart
                            existingCartItem.quantity++;
                        } else {
                            // Add new item to cart with quantity = 1
                            this.cart.push({
                                ...lesson,
                                cartId: Date.now() + Math.random(),
                                quantity: 1
                            });
                        }
                        
                        lesson.spaces--;
                        // Update lesson spaces on backend as well
                        this.updateLessonSpaces(lesson.id, lesson.spaces);
                    }
                },
                removeFromCart(index) {
                    const item = this.cart[index];
                    const quantity = item.quantity || 1;
                    
                    // Find the original lesson and restore space (multiply by quantity)
                    const lesson = this.lessons.find(l => l.id === item.id);
                    if (lesson) {
                        lesson.spaces += quantity;
                        // Update lesson spaces on backend as well
                        this.updateLessonSpaces(lesson.id, lesson.spaces);
                    }
                    
                    // Remove the item from cart
                    this.cart.splice(index, 1);
                },

                decreaseCartItemQuantity(index) {
                    const item = this.cart[index];
                    if (item.quantity > 1) {
                        item.quantity--;
                        // Restore one space to the lesson
                        const lesson = this.lessons.find(l => l.id === item.id);
                        if (lesson) {
                            lesson.spaces++;
                            this.updateLessonSpaces(lesson.id, lesson.spaces);
                        }
                    } else {
                        // If quantity is 1, remove the item entirely
                        this.removeFromCart(index);
                    }
                },

                increaseCartItemQuantity(index) {
                    const item = this.cart[index];
                    const lesson = this.lessons.find(l => l.id === item.id);
                    
                    // Only increase if spaces are available
                    if (lesson && lesson.spaces > 0) {
                        item.quantity++;
                        lesson.spaces--;
                        this.updateLessonSpaces(lesson.id, lesson.spaces);
                    }
                },

                async checkout() {
                    if (this.isCheckoutValid) {
                        try {
                            // Prepare order data for backend
                            const orderData = {
                                name: this.checkoutName,
                                phone: this.checkoutPhone,
                                lessons: this.cart.map(item => ({  // transform cart items into a clean structure for the backend
                                    lessonId: item.id,
                                    subject: item.subject,
                                    price: item.price,
                                    location: item.location,
                                    date: item.date
                                }))
                            };
                            
                            // Send order to backend
                            const response = await fetch(`${this.apiBaseUrl}/orders`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(orderData)
                            });
                            
                            if (response.ok) {
                                // // Update lesson spaces on backend
                                // for (const item of this.cart) {
                                //     await this.updateLessonSpaces(item.id, item.spaces);
                                // }
                                
                                // Show modal instead of alert
                                this.orderModalTitle = 'Order Submitted';
                                this.orderModalType = 'success';
                                this.orderModalMessage = `
                                    <strong>Name:</strong> ${this.checkoutName}<br>
                                    <strong>Total:</strong> £${this.cartTotalPrice}<br><br>
                                    Thank you for your order! We will contact you on ${this.checkoutPhone}.
                                `;
                                this.showOrderModal = true;
                                
                                // Reset cart and form
                                this.cart = [];
                                this.checkoutName = '';
                                this.checkoutPhone = '';
                                this.showCart = false;
                                
                                // Refresh lessons from backend to get updated spaces
                                await this.fetchLessons();
                            } else {
                                // Show failure modal
                                this.orderModalTitle = 'Order Failed';
                                this.orderModalType = 'error';
                                this.orderModalMessage = 'Failed to submit order. Please try again.';
                                this.showOrderModal = true;
                                await this.restoreSpacesAfterFailedOrder();
                            }
                        } catch (error) {
                            console.error('Checkout error:', error);
                            this.orderModalTitle = 'Network Error';
                            this.orderModalType = 'error';
                            this.orderModalMessage = 'Network error. Please check if backend is running.';
                            this.showOrderModal = true;
                            await this.restoreSpacesAfterFailedOrder();
                        }
                    }
                },


                // Hide modal without navigating away (used by the X button)
                closeOrderModal() {
                    this.showOrderModal = false;
                    this.orderModalTitle = '';
                    this.orderModalMessage = '';
                    this.orderModalType = 'info';
                },

                // Close modal and return to lessons page (used by footer button)
                confirmOrderClose() {
                    this.showOrderModal = false;
                    this.orderModalTitle = '';
                    this.orderModalMessage = '';
                    this.orderModalType = 'info';
                    // Ensure lessons view is shown
                    this.showCart = false;
                    // Optionally scroll to top of lessons
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },

                // UPDATE LESSON SPACES ON BACKEND
                async updateLessonSpaces(lessonId, newSpaces) {
                    try {
                        await fetch(`${this.apiBaseUrl}/lessons/${lessonId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ spaces: newSpaces })
                        });
                    } catch (error) {
                        console.error('Error updating lesson spaces:', error);
                    }
                },

                async restoreSpacesAfterFailedOrder() {
                    // Restore spaces in the frontend lessons array
                    for (const item of this.cart) {
                        const lesson = this.lessons.find(l => l.id === item.id);
                        if (lesson) {
                            lesson.spaces++;
                            // Update lesson spaces on backend as well
                            await this.updateLessonSpaces(lesson.id, lesson.spaces);
                        }
                    }
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
                    return `https://studyhere-backend-1-1vqv.onrender.com/images/${finalImage}`;
                },

                
                toggleDarkMode() {
                    this.darkMode = !this.darkMode;
                    if (this.darkMode) {
                        document.body.classList.add('dark-mode');
                    } else {
                        document.body.classList.remove('dark-mode');
                    }
                },

                // Add search on back 
                async searchOnBackend(){
                    await fetch(`${this.apiBaseUrl}/lessons?search=${this.searchQuery}`);
                }

            },
            mounted() {
                // Fetch lessons when the app is mounted
                this.fetchLessons();
            }
        });