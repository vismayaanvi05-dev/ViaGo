import React, { useState, useEffect } from 'react';
import { groceryAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Settings, TrendingUp, TrendingDown } from 'lucide-react';

const GroceryInventory = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [stockForm, setStockForm] = useState({
    product_id: '',
    store_id: '',
    operation: 'add',
    quantity: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, transactionsRes] = await Promise.all([
        groceryAPI.getProducts({}),
        groceryAPI.getTransactions({})
      ]);
      setProducts(productsRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await groceryAPI.updateStock(stockForm);
      toast({ title: 'Success', description: 'Stock updated successfully' });
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to update stock', variant: 'destructive' });
    }
  };

  const openStockDialog = (product) => {
    setSelectedProduct(product);
    setStockForm({
      product_id: product.id,
      store_id: product.store_id,
      operation: 'add',
      quantity: 0,
      notes: ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setStockForm({ product_id: '', store_id: '', operation: 'add', quantity: 0, notes: '' });
    setSelectedProduct(null);
  };

  if (loading) return <div className=\"p-8\">Loading...</div>;

  return (
    <div className=\"p-8\">
      <h1 className=\"text-3xl font-bold mb-8\">Inventory Management</h1>

      {/* Stock Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockUpdate} className=\"space-y-4\">
            <div className=\"space-y-2\">
              <Label>Current Stock: {selectedProduct?.current_stock} {selectedProduct?.unit_type}</Label>
            </div>

            <div className=\"space-y-2\">
              <Label>Operation *</Label>
              <Select value={stockForm.operation} onValueChange={(value) => setStockForm({...stockForm, operation: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"add\">Add Stock (Stock In)</SelectItem>
                  <SelectItem value=\"subtract\">Remove Stock (Stock Out)</SelectItem>
                  <SelectItem value=\"set\">Set Stock (Adjustment)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className=\"space-y-2\">
              <Label>Quantity *</Label>
              <Input type=\"number\" step=\"0.01\" value={stockForm.quantity} onChange={(e) => setStockForm({...stockForm, quantity: parseFloat(e.target.value)})} required />
            </div>

            <div className=\"space-y-2\">
              <Label>Notes</Label>
              <Input value={stockForm.notes} onChange={(e) => setStockForm({...stockForm, notes: e.target.value})} placeholder=\"Reason for stock update\" />
            </div>

            <div className=\"flex gap-2\">
              <Button type=\"submit\" className=\"flex-1\">Update Stock</Button>
              <Button type=\"button\" variant=\"outline\" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Products Stock Table */}
      <Card className=\"mb-8\">
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"overflow-x-auto\">
            <table className=\"w-full\">
              <thead className=\"border-b\">
                <tr>
                  <th className=\"text-left p-3\">Product</th>
                  <th className=\"text-left p-3\">Current Stock</th>
                  <th className=\"text-left p-3\">Low Stock Alert</th>
                  <th className=\"text-left p-3\">Status</th>
                  <th className=\"text-left p-3\">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (\n                  <tr key={product.id} className=\"border-b hover:bg-gray-50\">
                    <td className=\"p-3\">\n                      <div>\n                        <p className=\"font-medium\">{product.name}</p>\n                        <p className=\"text-sm text-gray-600\">{product.brand}</p>\n                      </div>\n                    </td>
                    <td className=\"p-3\">\n                      <span className={product.current_stock <= product.low_stock_threshold ? 'text-red-600 font-semibold' : ''}>\n                        {product.current_stock} {product.unit_type}\n                      </span>\n                    </td>
                    <td className=\"p-3\">{product.low_stock_threshold} {product.unit_type}</td>
                    <td className=\"p-3\">\n                      {product.current_stock <= product.low_stock_threshold ? (\n                        <Badge variant=\"destructive\">Low Stock</Badge>\n                      ) : product.current_stock <= product.low_stock_threshold * 2 ? (\n                        <Badge variant=\"secondary\">Medium</Badge>\n                      ) : (\n                        <Badge className=\"bg-green-600\">Good</Badge>\n                      )}\n                    </td>
                    <td className=\"p-3\">\n                      <Button size=\"sm\" variant=\"outline\" onClick={() => openStockDialog(product)}>\n                        <Settings className=\"h-4 w-4 mr-1\" />\n                        Update\n                      </Button>\n                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-2\">
            {transactions.slice(0, 10).map(txn => {\n              const product = products.find(p => p.id === txn.product_id);\n              return (\n                <div key={txn.id} className=\"flex items-center justify-between p-3 bg-gray-50 rounded\">\n                  <div className=\"flex items-center gap-3\">\n                    {txn.transaction_type === 'stock_in' ? (\n                      <TrendingUp className=\"h-5 w-5 text-green-600\" />\n                    ) : (\n                      <TrendingDown className=\"h-5 w-5 text-red-600\" />\n                    )}\n                    <div>\n                      <p className=\"font-medium\">{product?.name || 'Unknown Product'}</p>\n                      <p className=\"text-sm text-gray-600\">{txn.notes || txn.transaction_type}</p>\n                    </div>\n                  </div>\n                  <div className=\"text-right\">\n                    <p className=\"font-semibold\">\n                      {txn.transaction_type === 'stock_in' ? '+' : '-'}{txn.quantity}\n                    </p>\n                    <p className=\"text-sm text-gray-600\">\n                      {txn.previous_stock} → {txn.new_stock}\n                    </p>\n                  </div>\n                </div>\n              );\n            })}\n          </div>\n        </CardContent>
      </Card>
    </div>
  );
};

export default GroceryInventory;
