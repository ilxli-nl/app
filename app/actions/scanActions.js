'use server';

import { prisma } from '@/prisma';

// Register a barcode scan
export async function registerBarcodeScan(barcode, scannedBy = 'scanner') {
  try {
    console.log(`🔍 Registering scan for barcode: ${barcode}`);

    // Find the label with this barcode
    const label = await prisma.labels.findFirst({
      where: {
        Barcode: barcode,
      },
    });

    if (!label) {
      return {
        success: false,
        error: 'No order found with this barcode',
      };
    }

    // Get the main order details
    const mainOrder = await prisma.orders.findUnique({
      where: { orderItemId: label.orderItemId },
    });

    if (!mainOrder) {
      return {
        success: false,
        error: 'Order not found for this barcode',
      };
    }

    // Get ALL items for this order (same orderId)
    const allOrderItems = await prisma.orders.findMany({
      where: {
        orderId: mainOrder.orderId,
      },
      select: {
        orderItemId: true,
        orderId: true,
        title: true,
        quantity: true,
        unitPrice: true,
        ean: true,
        img: true,
        s_firstName: true,
        s_surname: true,
        s_streetName: true,
        s_houseNumber: true,
        s_houseNumberExtension: true,
        s_zipCode: true,
        s_city: true,
        s_countryCode: true,
        email: true,
      },
    });

    // Get product images for all items
    const eans = [
      ...new Set(allOrderItems.map((item) => item.ean).filter(Boolean)),
    ];
    let productImagesMap = {};

    if (eans.length > 0) {
      // Try Images table first
      const images = await prisma.images.findMany({
        where: { ean: { in: eans } },
      });

      images.forEach((image) => {
        productImagesMap[image.ean] = image.image;
      });

      // Fallback to ProductImage table if no images found
      if (Object.keys(productImagesMap).length === 0) {
        const productImages = await prisma.productImage.findMany({
          where: { ean: { in: eans } },
        });

        productImages.forEach((image) => {
          productImagesMap[image.ean] = image.imageUrl;
        });
      }
    }

    // Add product images to order items
    const orderItemsWithImages = allOrderItems.map((item) => ({
      ...item,
      productImage: item.ean ? productImagesMap[item.ean] : null,
      orderImage: item.img,
    }));

    const totalOrderValue = orderItemsWithImages.reduce((total, item) => {
      return total + (item.quantity || 1) * (item.unitPrice || 0);
    }, 0);

    // Check if already scanned
    const existingScan = await prisma.orderScan.findUnique({
      where: { orderItemId: label.orderItemId },
    });

    if (existingScan) {
      // Update existing scan
      const updatedScan = await prisma.orderScan.update({
        where: { orderItemId: label.orderItemId },
        data: {
          scannedAt: new Date(),
          scannedBy: scannedBy,
        },
      });

      return {
        success: true,
        data: {
          scan: updatedScan,
          order: mainOrder,
          allOrderItems: orderItemsWithImages,
          totalOrderValue,
          label,
        },
        message: 'Scan updated successfully',
        isRescan: true,
      };
    }

    // Create new scan record
    const scan = await prisma.orderScan.create({
      data: {
        orderItemId: label.orderItemId,
        barcode: barcode,
        scannedBy: scannedBy,
        status: 'scanned',
      },
    });

    console.log(`✅ Scan registered for order: ${mainOrder.orderId}`);
    return {
      success: true,
      data: {
        scan,
        order: mainOrder,
        allOrderItems: orderItemsWithImages,
        totalOrderValue,
        label,
      },
      message: 'Scan registered successfully',
      isRescan: false,
    };
  } catch (error) {
    console.error('❌ Error registering scan:', error);
    return {
      success: false,
      error: 'Failed to register scan: ' + error.message,
    };
  }
}

// Get scan history for an order
export async function getOrderScanHistory(orderItemId) {
  try {
    const scans = await prisma.orderScan.findMany({
      where: { orderItemId },
      orderBy: { scannedAt: 'desc' },
      include: {
        order: true,
      },
    });

    return { success: true, data: scans };
  } catch (error) {
    console.error('Error fetching scan history:', error);
    return { success: false, error: error.message };
  }
}

// Get all recent scans
export async function getRecentScans(limit = 50) {
  try {
    const scans = await prisma.orderScan.findMany({
      take: limit,
      orderBy: { scannedAt: 'desc' },
      include: {
        order: {
          select: {
            orderId: true,
            title: true,
            s_firstName: true,
            s_surname: true,
            s_city: true,
            s_countryCode: true,
          },
        },
      },
    });

    return { success: true, data: scans };
  } catch (error) {
    console.error('Error fetching recent scans:', error);
    return { success: false, error: error.message };
  }
}

// Get scan statistics
export async function getScanStatistics() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalScans, todayScans, uniqueOrdersScanned] = await Promise.all([
      // Total scans
      prisma.orderScan.count(),

      // Today's scans
      prisma.orderScan.count({
        where: {
          scannedAt: {
            gte: today,
          },
        },
      }),

      // Unique orders scanned
      prisma.orderScan.groupBy({
        by: ['orderItemId'],
        _count: {
          orderItemId: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalScans,
        todayScans,
        uniqueOrders: uniqueOrdersScanned.length,
      },
    };
  } catch (error) {
    console.error('Error fetching scan statistics:', error);
    return { success: false, error: error.message };
  }
}

// Update scan status (scanned -> processed -> shipped, etc.)
export async function updateScanStatus(orderItemId, status) {
  try {
    const scan = await prisma.orderScan.update({
      where: { orderItemId },
      data: { status },
      include: {
        order: true,
      },
    });

    return { success: true, data: scan };
  } catch (error) {
    console.error('Error updating scan status:', error);
    return { success: false, error: error.message };
  }
}

// Delete a scan record
export async function deleteScan(scanId) {
  try {
    await prisma.orderScan.delete({
      where: { id: scanId },
    });

    return { success: true, message: 'Scan record deleted successfully' };
  } catch (error) {
    console.error('Error deleting scan:', error);
    return { success: false, error: error.message };
  }
}

// Get scans by date range
export async function getScansByDateRange(startDate, endDate) {
  try {
    const scans = await prisma.orderScan.findMany({
      where: {
        scannedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { scannedAt: 'desc' },
      include: {
        order: {
          select: {
            orderId: true,
            title: true,
            s_firstName: true,
            s_surname: true,
            s_city: true,
            s_countryCode: true,
          },
        },
      },
    });

    return { success: true, data: scans };
  } catch (error) {
    console.error('Error fetching scans by date range:', error);
    return { success: false, error: error.message };
  }
}

// Get unscanned orders
export async function getUnscannedOrders() {
  try {
    // Get all orders that have labels but no scan records
    const ordersWithLabels = await prisma.orders.findMany({
      where: {
        labels: {
          isNot: null,
          Barcode: {
            not: null,
          },
        },
      },
      include: {
        labels: true,
      },
    });

    const scannedOrderIds = await prisma.orderScan.findMany({
      select: {
        orderItemId: true,
      },
    });

    const scannedIds = new Set(scannedOrderIds.map((scan) => scan.orderItemId));

    const unscannedOrders = ordersWithLabels.filter(
      (order) => !scannedIds.has(order.orderItemId)
    );

    return { success: true, data: unscannedOrders };
  } catch (error) {
    console.error('Error fetching unscanned orders:', error);
    return { success: false, error: error.message };
  }
}

// Bulk update scan status
export async function bulkUpdateScanStatus(orderItemIds, status) {
  try {
    const result = await prisma.orderScan.updateMany({
      where: {
        orderItemId: {
          in: orderItemIds,
        },
      },
      data: {
        status: status,
      },
    });

    return {
      success: true,
      message: `Updated ${result.count} scans to status: ${status}`,
      updatedCount: result.count,
    };
  } catch (error) {
    console.error('Error in bulk update scan status:', error);
    return { success: false, error: error.message };
  }
}

// Get scan by barcode
export async function getScanByBarcode(barcode) {
  try {
    const scan = await prisma.orderScan.findFirst({
      where: { barcode },
      include: {
        order: {
          select: {
            orderId: true,
            title: true,
            s_firstName: true,
            s_surname: true,
            s_city: true,
            s_countryCode: true,
          },
        },
      },
    });

    if (!scan) {
      return { success: false, error: 'Scan not found for this barcode' };
    }

    return { success: true, data: scan };
  } catch (error) {
    console.error('Error fetching scan by barcode:', error);
    return { success: false, error: error.message };
  }
}

// Export scans data
export async function exportScansData(format = 'json') {
  try {
    const scans = await prisma.orderScan.findMany({
      orderBy: { scannedAt: 'desc' },
      include: {
        order: {
          select: {
            orderId: true,
            title: true,
            s_firstName: true,
            s_surname: true,
            s_city: true,
            s_countryCode: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'Order ID',
        'Customer Name',
        'City',
        'Country',
        'Barcode',
        'Scanned At',
        'Status',
      ];
      const csvData = scans.map((scan) =>
        [
          scan.order.orderId,
          `${scan.order.s_firstName} ${scan.order.s_surname}`,
          scan.order.s_city,
          scan.order.s_countryCode,
          scan.barcode,
          scan.scannedAt.toISOString(),
          scan.status,
        ].join(',')
      );

      const csv = [headers.join(','), ...csvData].join('\n');
      return { success: true, data: csv, format: 'csv' };
    }

    // Default JSON format
    return { success: true, data: scans, format: 'json' };
  } catch (error) {
    console.error('Error exporting scans data:', error);
    return { success: false, error: error.message };
  }
}
