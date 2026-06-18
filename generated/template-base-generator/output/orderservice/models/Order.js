// Sinh ra từ DCSL Model: Order
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  
  id: {
    type: String,
    
  },
  
  totalAmount: {
    type: Number,
    
  },
  
  status: {
    type: String,
    default: 'PENDING'
  },
  
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);