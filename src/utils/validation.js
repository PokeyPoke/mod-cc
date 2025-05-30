const Joi = require('joi');

const schemas = {
  user: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    }),
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  },
  
  module: {
    create: Joi.object({
      type: Joi.string().valid('weather', 'notes', 'todo', 'countdown', 'links', 'custom').required(),
      config: Joi.object().default({})
    }),
    update: Joi.object({
      config: Joi.object().required()
    })
  },
  
  device: {
    register: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      type: Joi.string().valid('web', 'mobile', 'iot').required()
    })
  },
  
  settings: {
    update: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'blue', 'green').optional(),
      default_layout_preference: Joi.string().valid('grid', 'list').optional()
    }).min(1)
  },
  
  apiKey: {
    create: Joi.object({
      service: Joi.string().min(1).max(50).required(),
      api_key: Joi.string().min(1).required()
    })
  },
  
  layout: {
    save: Joi.object({
      layoutData: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          x: Joi.number().integer().min(0).required(),
          y: Joi.number().integer().min(0).required(),
          w: Joi.number().integer().min(1).required(),
          h: Joi.number().integer().min(1).required(),
          content: Joi.object().optional()
        })
      ).required()
    })
  }
};

function validate(schema, data) {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value;
}

module.exports = {
  schemas,
  validate
};