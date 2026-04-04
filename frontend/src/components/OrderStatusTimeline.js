import React from 'react';
import { Check, Clock, X, Package, Truck, Home } from 'lucide-react';

const OrderStatusTimeline = ({ statusHistory = [], currentStatus, module = 'food' }) => {
  // Define status flows for each module
  const statusFlows = {
    food: [
      { key: 'placed', label: 'Order Placed', icon: Package },
      { key: 'confirmed', label: 'Confirmed', icon: Check },
      { key: 'preparing', label: 'Preparing', icon: Clock },
      { key: 'ready', label: 'Ready for Pickup', icon: Package },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: Home }
    ],
    grocery: [
      { key: 'pending', label: 'Order Placed', icon: Package },
      { key: 'confirmed', label: 'Confirmed', icon: Check },
      { key: 'packing', label: 'Packing', icon: Clock },
      { key: 'ready', label: 'Ready', icon: Package },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: Home }
    ],
    laundry: [
      { key: 'pending', label: 'Order Placed', icon: Package },
      { key: 'pickup_assigned', label: 'Pickup Assigned', icon: Clock },
      { key: 'picked_up', label: 'Picked Up', icon: Truck },
      { key: 'at_facility', label: 'At Facility', icon: Home },
      { key: 'processing', label: 'Processing', icon: Clock },
      { key: 'ready', label: 'Ready', icon: Check },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: Home }
    ]
  };

  const statuses = statusFlows[module] || statusFlows.food;
  
  // Find current status index
  const currentIndex = statuses.findIndex(s => s.key === currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="relative">
      {isCancelled ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <X className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Order Cancelled</p>
            {statusHistory.find(h => h.status === 'cancelled')?.notes && (
              <p className="text-sm text-red-600 mt-1">
                {statusHistory.find(h => h.status === 'cancelled').notes}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {statuses.map((status, index) => {
            const StatusIcon = status.icon;
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const historyEntry = statusHistory.find(h => h.status === status.key);
            
            return (
              <div key={status.key} className="flex items-start gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  {index < statuses.length - 1 && (
                    <div
                      className={`w-0.5 h-12 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>

                {/* Status Info */}
                <div className="flex-1 pb-4">
                  <p
                    className={`font-medium ${
                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {status.label}
                  </p>
                  {historyEntry && (
                    <>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(historyEntry.timestamp).toLocaleString()}
                      </p>
                      {historyEntry.notes && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          {historyEntry.notes}
                        </p>
                      )}
                    </>
                  )}
                  {isCurrent && !historyEntry && (
                    <p className="text-sm text-blue-600 mt-1 font-medium">
                      In Progress...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderStatusTimeline;
