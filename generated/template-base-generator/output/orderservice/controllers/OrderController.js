// Sinh ra từ AGL: Activity Graph cho Order
const Order = require('../models/Order');


exports.approveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Step: open (Atomic Action)
    let record = await Order.findById(id);
    if (!record) return res.status(404).json({ error: 'Not found' });

    
      
      
      
    
      
        // Step: Decisional Pattern
        if (!(record.status === &#39;PENDING&#39;)) {
           return res.status(400).json({ error: 'Business rule validation failed' });
        }
      
      
      
    
      
      
      
        // Step: setDataFieldValues
        
          record.status = 'APPROVED';
        
      
    
      
      
      
    

    // Step: save
    await record.save();
    return res.status(200).json(record);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
