const prisma = require('../config/database');

const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      size,
      color,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    let where = {};
    
    if (category) {
      where.category = { slug: category };
    }
    
    if (minPrice || maxPrice) {
      where.variants = {
        some: {
          price: {
            gte: minPrice ? parseInt(minPrice) : undefined,
            lte: maxPrice ? parseInt(maxPrice) : undefined
          }
        }
      };
    }
    
    if (size) {
      where.variants = {
        some: {
          size: size.toUpperCase()
        }
      };
    }
    
    if (color) {
      where.color = { contains: color, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: { take: 1 },
        variants: true,
        category: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.product.count({ where });

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

const getProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        variants: true,
        category: true,
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

module.exports = {
  getProducts,
  getProduct
};