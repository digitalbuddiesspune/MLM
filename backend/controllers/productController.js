import Product from '../models/Product.js';

/**
 * GET /api/products
 * List all active products (optional: ?active=true|false for filter)
 */
export async function getProducts(req, res, next) {
  try {
    const activeOnly = req.query.active !== 'false';
    const filter = activeOnly ? { isActive: true } : {};

    const products = await Product.find(filter)
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/:id
 * Get a single product by id
 */
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/products
 * Create a new product (admin only)
 */
export async function createProduct(req, res, next) {
  try {
    const { name, slug, description, price, businessVolume, isActive, imageUrl } = req.body;

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      businessVolume,
      isActive,
      imageUrl: imageUrl || null,
    });

    res.status(201).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/products/:id
 * Update an existing product (admin only)
 */
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, description, price, businessVolume, isActive, imageUrl } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    if (name !== undefined) product.name = name;
    if (slug !== undefined) product.slug = slug;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (businessVolume !== undefined) product.businessVolume = businessVolume;
    if (isActive !== undefined) product.isActive = isActive;
    if (imageUrl !== undefined) product.imageUrl = imageUrl || null;

    await product.save();

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/products/:id
 * Delete a product (admin only)
 */
export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      data: { productId: id },
    });
  } catch (error) {
    next(error);
  }
}
