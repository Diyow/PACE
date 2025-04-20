// app/dashboard/components/RecentOrdersTable.js
const orders = [
    { id: 1, product: 'Laptop', amount: '$1200', status: 'Shipped' },
    { id: 2, product: 'Keyboard', amount: '$75', status: 'Delivered' },
    { id: 3, product: 'Mouse', amount: '$25', status: 'Processing' },
  ];
  
  export default function RecentOrdersTable() {
    return (
      <div className="bg-white p-4 rounded-md shadow-md">
        <h5 className="font-semibold mb-2">Recent Orders</h5>
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th>ID</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.product}</td>
                <td>{order.amount}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }