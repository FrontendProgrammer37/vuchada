import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import apiService from '../services/api';
import toast from '../utils/toast';

const Produtos = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    // Estados para modal
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sku: '',
        cost_price: '',
        sale_price: '',
        current_stock: '0',
        min_stock: '0',
        category_id: '',
        venda_por_peso: false
    });

    // Carregar produtos e categorias
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsData, categoriesData] = await Promise.all([
                apiService.getProducts(),
                apiService.getCategories()
            ]);
            
            setProducts(productsData);
            setCategories(categoriesData);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar dados: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    // Filtrar produtos
    const filteredProducts = products.filter(product => {
        const productName = product.name ? product.name.toLowerCase() : '';
        const productSku = product.sku ? product.sku.toLowerCase() : '';
        const searchTermLower = searchTerm ? searchTerm.toLowerCase() : '';
        
        const matchesSearch = productName.includes(searchTermLower) ||
                            productSku.includes(searchTermLower);
        const matchesCategory = !selectedCategory || product.category_id === parseInt(selectedCategory);
        return matchesSearch && matchesCategory && product.is_active;
    });

    // Abrir modal para criar/editar produto
    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name || '',
                description: product.description || '',
                sku: product.sku || '',
                cost_price: product.cost_price || '',
                sale_price: product.sale_price || '',
                current_stock: product.current_stock?.toString() || '0',
                min_stock: product.min_stock?.toString() || '0',
                category_id: product.category_id || '',
                venda_por_peso: product.venda_por_peso || false
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                sku: '',
                cost_price: '',
                sale_price: '',
                current_stock: '0',
                min_stock: '0',
                category_id: '',
                venda_por_peso: false
            });
        }
        setShowModal(true);
    };

    // Fechar modal
    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            sku: '',
            cost_price: '',
            sale_price: '',
            current_stock: '0',
            min_stock: '0',
            category_id: '',
            venda_por_peso: false
        });
    };

    // Salvar produto
    const saveProduct = async () => {
        try {
            setError(null);
            const productData = {
                name: formData.name,
                description: formData.description || null,
                sku: formData.sku,
                cost_price: parseFloat(formData.cost_price) || 0,
                sale_price: parseFloat(formData.sale_price) || 0,
                current_stock: parseInt(formData.current_stock) || 0,
                min_stock: parseInt(formData.min_stock) || 0,
                category_id: formData.category_id ? parseInt(formData.category_id) : null,
                venda_por_peso: !!formData.venda_por_peso
            };

            if (editingProduct) {
                await apiService.updateProduct(editingProduct.id, productData);
                toast.success('Produto atualizado com sucesso!');
            } else {
                await apiService.createProduct(productData);
                toast.success('Produto criado com sucesso!');
            }

            closeModal();
            loadData();
        } catch (err) {
            console.error('Erro ao salvar produto:', err);
            const errorMessage = err.message.includes('Já existe um produto')
                ? err.message
                : 'Erro ao salvar produto. Verifique os dados e tente novamente.';
            
            setError(errorMessage);
            // Scroll to top to show the error message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Estados para modal de exclusão de produto individual
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    
    // Abrir modal de exclusão
    const openDeleteModal = (productId) => {
        setProductToDelete(productId);
        setShowDeleteModal(true);
    };
    
    // Fechar modal de exclusão
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
    };
    
    // Deletar produto (soft delete)
    const confirmDeleteProduct = async () => {
        try {
            await apiService.deleteProduct(productToDelete);
            // Atualizar o estado local para refletir a desativação
            setProducts(products.map(p => 
                p.id === productToDelete ? { ...p, is_active: false } : p
            ));
            setError(null);
            closeDeleteModal();
            toast.success('Produto desativado com sucesso');
        } catch (err) {
            setError('Erro ao desativar produto: ' + (err.response?.data?.detail || err.message));
            console.error('Erro ao desativar produto:', err);
            closeDeleteModal();
        }
    };

    // Ativar produto
    const activateProduct = async (productId) => {
        try {
            await apiService.activateProduct(productId);
            // Atualizar o estado local para refletir a ativação
            setProducts(products.map(p => 
                p.id === productId ? { ...p, is_active: true } : p
            ));
            toast.success('Produto ativado com sucesso');
        } catch (err) {
            setError('Erro ao ativar produto: ' + (err.response?.data?.detail || err.message));
            console.error('Erro ao ativar produto:', err);
        }
    };

    // Deletar todos os produtos (soft delete)
    const confirmDeleteAllProducts = async () => {
        try {
            await apiService.deleteAllProducts();
            // Atualizar o estado local para refletir a desativação de todos os produtos
            setProducts(products.map(p => ({ ...p, is_active: false })));
            setError(null);
            closeDeleteAllModal();
            toast.success('Todos os produtos foram desativados');
        } catch (err) {
            setError('Erro ao desativar produtos: ' + (err.response?.data?.detail || err.message));
            console.error('Erro ao desativar produtos:', err);
            closeDeleteAllModal();
        }
    };

    // Deletar todos os produtos
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    
    const openDeleteAllModal = () => {
        setShowDeleteAllModal(true);
    };
    
    const closeDeleteAllModal = () => {
        setShowDeleteAllModal(false);
    };

    // Formatar preço
    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-MZ', {
            style: 'currency',
            currency: 'MZN'
        }).format(price);
    };

    // Render status badge
    const renderStatusBadge = (isActive) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
            {isActive ? 'Ativo' : 'Inativo'}
        </span>
    );

    // Render action buttons based on product status
    const renderProductActions = (product) => (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => openModal(product)}
                className="text-blue-600 hover:text-blue-900"
                title="Editar"
            >
                <Edit className="h-4 w-4" />
            </button>
            {product.is_active ? (
                <button
                    onClick={() => openDeleteModal(product.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Desativar"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            ) : (
                <button
                    onClick={() => activateProduct(product.id)}
                    className="text-green-600 hover:text-green-900"
                    title="Ativar"
                >
                    <Eye className="h-4 w-4" />
                </button>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Modal de confirmação para excluir todos os produtos */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-red-600 mb-4">Confirmação de Exclusão</h3>
                        <p className="text-gray-700 mb-6">ATENÇÃO: Tem certeza que deseja deletar TODOS os produtos? Esta ação não pode ser desfeita!</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeDeleteAllModal}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteAllProducts}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                                Excluir Todos
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de confirmação para excluir um produto */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-red-600 mb-4">Confirmação de Exclusão</h3>
                        <p className="text-gray-700 mb-6">Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita!</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteProduct}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
                    <p className="text-gray-600">Gerencie seu catálogo de produtos</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={openDeleteAllModal}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Trash2 className="h-5 w-5" />
                        Excluir Todos
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Novo Produto
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Busca */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Categoria */}
                    <div className="lg:w-48">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todas as categorias</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botão de filtros mobile */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="lg:hidden bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Filter className="h-5 w-5" />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Lista de produtos */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden lg:block">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Produto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    SKU
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Preço
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estoque
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoria
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className={!product.is_active ? 'bg-gray-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {product.name}
                                            </div>
                                            {product.description && (
                                                <div className="text-sm text-gray-500">
                                                    {product.description}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {product.sku}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatPrice(product.sale_price)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {product.current_stock}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Min: {product.min_stock}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {categories.find(c => c.id === product.category_id)?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {renderStatusBadge(product.is_active)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {renderProductActions(product)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden">
                    <div className="p-4 space-y-4">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className={`bg-white p-4 rounded-lg shadow ${!product.is_active ? 'opacity-70' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                                        <p className="text-sm text-gray-500">{product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-gray-900">
                                            {formatPrice(product.sale_price)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Estoque: {product.current_stock}
                                        </div>
                                    </div>
                                </div>
                                
                                {product.description && (
                                    <p className="text-sm text-gray-600">{product.description}</p>
                                )}
                                
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>
                                        Categoria: {categories.find(c => c.id === product.category_id)?.name || '-'}
                                    </span>
                                    <span>Min: {product.min_stock}</span>
                                </div>
                                
                                <div className="mt-2">
                                    {renderStatusBadge(product.is_active)}
                                </div>
                                
                                <div className="flex space-x-2 pt-2">
                                    {renderProductActions(product)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Search className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum produto encontrado
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm || selectedCategory ? 'Tente ajustar os filtros' : 'Comece criando seu primeiro produto'}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de Produto */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">
                                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                            </h2>
                            
                            <form onSubmit={(e) => { e.preventDefault(); saveProduct(); }} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Código (desktop) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Código (SKU) *
                                        </label>
                                        <input
                                            type="text"
                                            id="sku"
                                            value={formData.sku}
                                            onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            required
                                        />
                                    </div>

                                    {/* Categoria */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Categoria
                                        </label>
                                        <select
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Selecione uma categoria</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Nome */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nome *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Vender por Peso */}
                                    <div className="flex items-center">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.venda_por_peso}
                                                onChange={(e) => setFormData({...formData, venda_por_peso: e.target.checked})}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Vender por Peso</span>
                                        </label>
                                    </div>

                                    {/* Descrição */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Descrição
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            rows="2"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Preço Custo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Preço Custo *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.cost_price}
                                            onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Preço Venda */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Preço Venda *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.sale_price}
                                            onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Estoque */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estoque *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.current_stock}
                                            onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Estoque Mínimo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estoque Mínimo *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.min_stock}
                                            onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Botões */}
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                                    >
                                        {editingProduct ? 'Atualizar' : 'Criar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Produtos;